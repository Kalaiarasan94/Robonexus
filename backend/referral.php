<?php
// referral.php - Referral tracking and wallet balance.
//
// A contractor's referral code IS their phone number, so there is nothing extra
// to generate or store on their own record. What we store is `referred_by` on
// the person who was introduced: the phone number of whoever referred them.
//
// Money rules live in this file and nowhere else, so there is exactly one place
// to change if the promotion changes.

require_once __DIR__ . '/db.php';

// Every completed block of REFERRALS_PER_BONUS referrals pays REFERRAL_BONUS.
// i.e. 6 referrals -> ₹1000, 12 -> ₹2000, 17 -> ₹2000 (the 18th completes the third).
if (!defined('REFERRALS_PER_BONUS')) define('REFERRALS_PER_BONUS', 6);
if (!defined('REFERRAL_BONUS'))      define('REFERRAL_BONUS', 1000.00);

// Withdrawals below this are rejected, to avoid ₹5 payout requests.
if (!defined('MIN_WITHDRAWAL')) define('MIN_WITHDRAWAL', 100.00);

if (!function_exists('normalisePhone')) {
    /**
     * Canonical form used for every referral-code comparison.
     *
     * Strips non-digits, then keeps the LAST 10 — so "+91 90000 00000",
     * "091-90000-00000" and "9000000000" all resolve to the same contractor.
     * Without the trailing-10 step a country code silently breaks the match.
     */
    function normalisePhone($phone) {
        $digits = preg_replace('/\D/', '', (string) $phone);
        return strlen($digits) > 10 ? substr($digits, -10) : $digits;
    }
}

if (!function_exists('loadUsersFallback')) {
    function loadUsersFallback() {
        $f = __DIR__ . '/users.json';
        if (!file_exists($f)) return [];
        $d = json_decode(file_get_contents($f), true);
        return is_array($d) ? $d : [];
    }
}

if (!function_exists('findUserByReferralCode')) {
    /**
     * Look up a contractor by their referral code (= their phone number).
     * Returns ['name' => ..., 'email' => ..., 'phone' => ...] or null.
     */
    function findUserByReferralCode($pdo, $code) {
        $digits = normalisePhone($code);
        if ($digits === '') return null;

        if ($pdo !== null) {
            try {
                // Compare digits-only on both sides so stored formatting doesn't matter.
                $stmt = $pdo->query("SELECT `name`, `email`, `phone` FROM `users`");
                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                    if (normalisePhone($row['phone']) === $digits) {
                        return ['name' => $row['name'], 'email' => $row['email'], 'phone' => $row['phone']];
                    }
                }
                return null;
            } catch (PDOException $e) {
                error_log("Referral lookup failed: " . $e->getMessage());
            }
        }

        foreach (loadUsersFallback() as $u) {
            if (normalisePhone($u['phone'] ?? '') === $digits) {
                return ['name' => $u['name'] ?? '', 'email' => $u['email'] ?? '', 'phone' => $u['phone'] ?? ''];
            }
        }
        return null;
    }
}

if (!function_exists('getReferralsOf')) {
    /**
     * Everyone introduced by the contractor holding $phone.
     * @return array<int, array{name:string,email:string,joinedAt:string}>
     */
    function getReferralsOf($pdo, $phone) {
        $digits = normalisePhone($phone);
        if ($digits === '') return [];
        $out = [];

        if ($pdo !== null) {
            try {
                $stmt = $pdo->query("SELECT `name`, `email`, `referred_by`, `timestamp` FROM `users` ORDER BY `timestamp` DESC");
                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                    if (normalisePhone($row['referred_by'] ?? '') === $digits) {
                        $out[] = [
                            'name' => $row['name'],
                            'email' => $row['email'],
                            'joinedAt' => $row['timestamp'],
                        ];
                    }
                }
                return $out;
            } catch (PDOException $e) {
                error_log("Referral list failed: " . $e->getMessage());
            }
        }

        foreach (loadUsersFallback() as $u) {
            if (normalisePhone($u['referredBy'] ?? '') === $digits) {
                $out[] = [
                    'name' => $u['name'] ?? '',
                    'email' => $u['email'] ?? '',
                    'joinedAt' => $u['timestamp'] ?? '',
                ];
            }
        }
        usort($out, fn($a, $b) => strcmp($b['joinedAt'], $a['joinedAt']));
        return $out;
    }
}

if (!function_exists('referralBonusFor')) {
    /** Bonus earned for $count referrals. */
    function referralBonusFor($count) {
        return floor($count / REFERRALS_PER_BONUS) * REFERRAL_BONUS;
    }
}

if (!function_exists('getWithdrawalsOf')) {
    function getWithdrawalsOf($pdo, $email) {
        $out = [];
        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM `withdrawals` WHERE `user_email` = :e ORDER BY `requested_at` DESC");
                $stmt->execute([':e' => $email]);
                foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                    $out[] = [
                        'id' => (int) $row['id'],
                        'amount' => (float) $row['amount'],
                        'status' => $row['status'],
                        'bankName' => $row['bank_name'],
                        'accountNumber' => $row['account_number'],
                        'adminNote' => $row['admin_note'],
                        'requestedAt' => $row['requested_at'],
                        'processedAt' => $row['processed_at'],
                    ];
                }
                return $out;
            } catch (PDOException $e) {
                error_log("Withdrawal list failed: " . $e->getMessage());
            }
        }

        $f = __DIR__ . '/withdrawals.json';
        if (file_exists($f)) {
            $d = json_decode(file_get_contents($f), true);
            if (is_array($d)) {
                foreach ($d as $w) {
                    if (strcasecmp($w['userEmail'] ?? '', $email) === 0) $out[] = $w;
                }
            }
        }
        usort($out, fn($a, $b) => strcmp($b['requestedAt'] ?? '', $a['requestedAt'] ?? ''));
        return $out;
    }
}

if (!function_exists('getWalletSummary')) {
    /**
     * Wallet balance for one contractor.
     *
     * Deliberately derived from source records on every call rather than kept as
     * a running total — there is no balance column to drift out of sync.
     *
     * Credits: referral bonuses + earnings on APPROVED telemetry uploads.
     * Debits:  withdrawals that are paid or still pending (pending money is
     *          already spoken for and must not be requestable twice).
     *
     * The demo/baseline logs that get_user_stats.php adds for presentation are
     * NOT counted here — they are fabricated, and paying out against them would
     * mean paying real money for work that never happened.
     */
    function getWalletSummary($pdo, $email, $phone) {
        $referrals = getReferralsOf($pdo, $phone);
        $referralCount = count($referrals);
        $referralEarnings = referralBonusFor($referralCount);

        // Earnings from genuinely approved uploads only.
        $uploadEarnings = 0.0;
        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare(
                    "SELECT COALESCE(SUM(`earnings`), 0) FROM `user_uploads`
                     WHERE `user_email` = :e AND (`status` = 'Approved' OR `status` = 'Verified')"
                );
                $stmt->execute([':e' => $email]);
                $uploadEarnings = (float) $stmt->fetchColumn();
            } catch (PDOException $e) {
                error_log("Upload earnings failed: " . $e->getMessage());
            }
        } else {
            $f = __DIR__ . '/user_uploads.json';
            if (file_exists($f)) {
                $d = json_decode(file_get_contents($f), true);
                if (is_array($d)) {
                    foreach ($d as $u) {
                        if (strcasecmp($u['userEmail'] ?? '', $email) === 0
                            && in_array($u['status'] ?? '', ['Approved', 'Verified'], true)) {
                            $uploadEarnings += (float) ($u['earnings'] ?? 0);
                        }
                    }
                }
            }
        }

        $withdrawals = getWithdrawalsOf($pdo, $email);
        $withdrawn = 0.0;
        $pending = 0.0;
        foreach ($withdrawals as $w) {
            if ($w['status'] === 'paid') {
                $withdrawn += (float) $w['amount'];
            } elseif ($w['status'] === 'pending') {
                $pending += (float) $w['amount'];
            }
        }

        $totalEarned = $referralEarnings + $uploadEarnings;
        $available = $totalEarned - $withdrawn - $pending;
        if ($available < 0) $available = 0.0;

        // How many more referrals until the next bonus lands.
        $toNextBonus = REFERRALS_PER_BONUS - ($referralCount % REFERRALS_PER_BONUS);
        if ($toNextBonus === REFERRALS_PER_BONUS && $referralCount > 0) $toNextBonus = REFERRALS_PER_BONUS;

        return [
            'referralCount'      => $referralCount,
            'referrals'          => $referrals,
            'referralEarnings'   => round($referralEarnings, 2),
            'uploadEarnings'     => round($uploadEarnings, 2),
            'totalEarned'        => round($totalEarned, 2),
            'withdrawn'          => round($withdrawn, 2),
            'pendingWithdrawal'  => round($pending, 2),
            'available'          => round($available, 2),
            'withdrawals'        => $withdrawals,
            'referralsPerBonus'  => REFERRALS_PER_BONUS,
            'bonusPerBlock'      => REFERRAL_BONUS,
            'referralsToNext'    => $toNextBonus,
            'minWithdrawal'      => MIN_WITHDRAWAL,
        ];
    }
}
