"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  ArrowRight, 
  Upload, 
  X, 
  CheckCircle, 
  Phone, 
  User, 
  MapPin, 
  AlertCircle,
  Zap,
  DollarSign
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  category: string;
  description: string;
  specs: string[];
  image: string;
  badge?: string;
  comingSoon?: boolean;
}

const productsData: Product[] = [
  {
    id: "prod-core-x",
    name: "ABS+ Head Mount",
    price: "₹400.00", // User said: "product cost 500 total payable 800 (with registration fee 300)"
    priceNum: 400.00,
    category: "Hardware",
    description: "Universal ABS+ Elastic Nylon Belt Head Mount Phone Holder Head Strap Mount Headband Holder with Mobile Phone Clip Bracket for 7~10cm Wide Mobile Phone or Sports Camera.",
    specs: ["First-person shooting with headband is more effective than hand-held shooting, making the video screen more immersive", 
      "The two shooting modes can be switched horizontally and vertically, 120° flip and adjustable, and a variety of detachables to meet individual needs.", 
      "Elastic stretchable belt, moderate elasticity and non-stop head, adapt to various head circumferences", 
      "Non-slip soft rubber, comfortable foam pad, improve wearing comfort", 
    "Compatible with all kinds of mobile phones/sports cameras. The cold shoe openings at both ends of the mobile phone holder can be added with lights"],
    image: "/product_core.png",
    badge: "Available Now"
  },
  {
    id: "prod-gloves-v3",
    name: "Haptic Demonstration Gloves v3",
    price: "₹799.00",
    priceNum: 799.00,
    category: "Input Devices / Robotics",
    description: "Premium tactile feedback gloves engineered for high-fidelity dataset annotation and robot demonstration. Translates complex human hand actions into robotic motion trajectories in real time.",
    specs: ["Sub-millimeter tracking precision", "24 Haptic Feedback Actuators", "Flexible Carbon-Fiber Mesh", "Ultra-low latency wireless (2.4GHz)"],
    image: "/product_gloves.png",
    comingSoon: true
  },
  {
    id: "prod-sensor-cam",
    name: "Spatial-Vision Cam Sensor",
    price: "₹599.00",
    priceNum: 599.00,
    category: "Sensors / Computer Vision",
    description: "High-resolution stereo-depth camera system with integrated cyan alignment lasers. Optimized for scanning dynamic environments and generating high-accuracy 3D visual datasets.",
    specs: ["Dual 4K HDR sensors", "Active Cyan Laser Depth Map", "IP67 Weather-proof Rating", "USB-C Power Delivery & Data Link"],
    image: "/product_sensor.png",
    comingSoon: true
  },
  {
    id: "prod-dataset-manip",
    name: "Dataset Pack: Manipulation v1.2",
    price: "₹299.00",
    priceNum: 299.00,
    category: "Digital Datasets",
    description: "Curated, high-fidelity robotic demonstration dataset consisting of over 50,000 real-world physical manipulation sequences. Cleansed, annotated, and formatted for immediate model training.",
    specs: ["50,000+ High-Res Video sequences", "Full joint-torque annotation", "Varied lighting & textures", "Compatible with ROS & PyTorch"],
    image: "/product_dataset.png",
    comingSoon: true
  }
];


export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product>(productsData[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setSubmitError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Check file type
      if (file.type.startsWith("image/")) {
        setScreenshot(file);
        setScreenshotPreview(URL.createObjectURL(file));
        setSubmitError(null);
      } else {
        setSubmitError("Please upload an image file (PNG, JPG, WEBP).");
      }
    }
  };

  // Checkout submission handler
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate inputs
    if (!name.trim()) return setSubmitError("Please enter your name.");
    if (!phone.trim()) return setSubmitError("Please enter your phone number.");
    if (!address.trim()) return setSubmitError("Please enter your delivery address.");

    setIsSubmitting(true);

    // Create form data for API upload
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("productId", selectedProduct.id);
    formData.append("productName", selectedProduct.name);
    formData.append("productPrice", selectedProduct.price);

    try {
      // Connect to PHP backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
      const response = await fetch(`${apiUrl}/submit_order.php`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setOrderSuccess(true);
        setCreatedOrderId(data.orderId);
        // Clear fields
        setName("");
        setPhone("");
        setAddress("");
        setScreenshot(null);
        setScreenshotPreview(null);
      } else {
        setSubmitError(data.message || "An error occurred while placing the order.");
      }
    } catch (err) {
      console.error("Connection error to PHP API:", err);
      setSubmitError("Failed to connect to the payment server. Please verify that XAMPP Apache is running at http://localhost.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="text-center mb-12">
        <span className="text-xs font-mono font-bold tracking-widest text-brand-cyan uppercase bg-brand-cyan/10 px-3.5 py-1.5 rounded-full border border-brand-cyan/20">
          RoboNexus Store
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-white">
          Accelerate Your <span className="text-gradient">AI Infrastructure</span>
        </h1>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm sm:text-base">
          Invest in advanced physical-world sensory arrays, high-speed neural hardware, and curated humanoid-manipulation training datasets.
        </p>
      </div>

      {/* Main Split Layout: Left side selected details, Right side product lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Selected Product Detail View */}
        <div className="lg:col-span-6 bg-brand-card/60 backdrop-blur-md border border-brand-card-border rounded-3xl p-6 sm:p-8 shadow-xl sticky top-28">
          <div className="w-full rounded-2xl overflow-hidden bg-brand-dark/40 mb-6 border border-brand-card-border flex items-center justify-center p-4">
            <Image
              src={selectedProduct.image}
              alt={selectedProduct.name}
              width={500}
              height={400}
              className="transition-transform duration-500 scale-100 w-full h-auto"
            />
            {selectedProduct.badge && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-brand-purple to-brand-indigo text-white text-xs font-bold font-mono px-3 py-1 rounded-full border border-brand-violet/30 shadow-md">
                {selectedProduct.badge}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-semibold font-mono text-brand-violet uppercase tracking-wide">
                {selectedProduct.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {selectedProduct.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-brand-cyan">
                {selectedProduct.price}
              </span>
              <p className="text-[11px] sm:text-[10px] font-mono text-gray-500 mt-0.5">Free Global Express Shipping</p>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            {selectedProduct.description}
          </p>

          <div className="border-t border-brand-card-border pt-6 mb-8">
            <h3 className="text-xs font-bold font-mono tracking-widest text-white uppercase mb-4 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-brand-cyan" />
              Technical Specifications
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-400">
              {selectedProduct.specs.map((spec, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan shrink-0" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              window.location.href = "/register?product=prod-core-x";
            }}
            className="w-full relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-purple py-4 font-bold text-white shadow-lg shadow-brand-cyan/15 hover:shadow-brand-cyan/25 transition-all cursor-pointer group"
          >
            <ShoppingBag className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
            Order & Onboard Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>

        {/* RIGHT COLUMN: 4 Product Grid */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {productsData.map((prod) => {
            const isSelected = selectedProduct.id === prod.id;
            const isComingSoon = prod.comingSoon === true;
            return (
              <div
                key={prod.id}
                onClick={() => {
                  if (!isComingSoon) {
                    setSelectedProduct(prod);
                  }
                }}
                className={`glow-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
                  isComingSoon 
                    ? "opacity-50 cursor-not-allowed border-dashed border-brand-card-border/40 select-none" 
                    : isSelected 
                      ? "border-brand-cyan bg-brand-card/90 ring-1 ring-brand-cyan/35 scale-[1.01] cursor-pointer" 
                      : "border-brand-card-border hover:border-brand-cyan/40 hover:scale-[1.01] cursor-pointer"
                }`}
              >
                <div>
                  <div className="relative w-full rounded-xl overflow-hidden bg-brand-dark/40 mb-4 flex items-center justify-center p-2">
                    <Image
                      src={prod.image}
                      alt={prod.name}
                      width={250}
                      height={200}
                      className="w-full h-auto"
                    />
                    {isComingSoon ? (
                      <span className="absolute top-2.5 left-2.5 bg-red-950/85 backdrop-blur-md text-[11px] sm:text-[10px] font-bold font-mono text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                        COMING SOON
                      </span>
                    ) : prod.badge ? (
                      <span className="absolute top-2.5 left-2.5 bg-brand-dark/85 backdrop-blur-md text-[11px] sm:text-[10px] font-bold font-mono text-brand-violet px-2 py-0.5 rounded-full border border-brand-purple/20">
                        {prod.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] sm:text-[10px] font-mono text-brand-cyan uppercase tracking-wide">
                    {prod.category}
                  </span>
                  <h3 className="font-bold text-white text-base sm:text-lg mt-0.5 line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-brand-card-border/60">
                  <span className="font-extrabold text-white text-base">
                    {isComingSoon ? "TBD" : prod.price}
                  </span>
                  <span className={`text-xs font-mono font-semibold transition-colors ${
                    isComingSoon 
                      ? "text-red-400" 
                      : isSelected ? "text-brand-cyan" : "text-brand-violet"
                  }`}>
                    {isComingSoon 
                      ? "Locked" 
                      : isSelected ? "Selected View" : "View Details"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* CART DRAWER SLIDE-OUT PANEL (Right Side) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Drawer Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-brand-dark z-50 backdrop-blur-xs"
            />

            {/* Right Drawer Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0b0b0f] border-l border-brand-card-border/80 z-50 shadow-2xl overflow-y-auto"
            >
              {/* Header inside drawer */}
              <div className="p-6 border-b border-brand-card-border flex items-center justify-between sticky top-0 bg-[#0b0b0f]/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-brand-cyan" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Checkout Drawer</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-brand-card/50 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Success Panel */}
              {orderSuccess ? (
                <div className="p-8 flex flex-col items-center justify-center text-center h-[calc(100%-80px)]">
                  <div className="h-16 w-16 bg-brand-cyan/15 rounded-full flex items-center justify-center border border-brand-cyan/35 mb-6 text-brand-cyan">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h3>
                  <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
                    Thank you, <span className="text-white font-semibold">{name}</span>. Your payment screenshot has been uploaded. Our validation agents will review it shortly.
                  </p>
                  
                  <div className="bg-brand-card border border-brand-card-border/80 p-5 rounded-2xl w-full text-left mb-8">
                    <div className="flex justify-between border-b border-brand-card-border/40 pb-2 mb-2 text-xs">
                      <span className="text-gray-500 font-mono">ORDER ID</span>
                      <span className="text-brand-cyan font-mono font-bold">{createdOrderId}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-card-border/40 pb-2 mb-2 text-xs">
                      <span className="text-gray-500 font-mono">PRODUCT</span>
                      <span className="text-white font-semibold">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-mono">TOTAL PAID</span>
                      <span className="text-white font-bold">{selectedProduct.price}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="w-full rounded-xl border border-brand-card-border bg-brand-card py-3.5 text-sm font-bold text-white hover:bg-brand-card/80 transition-all cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                /* Form and Checkout Info */
                <form onSubmit={handleCheckoutSubmit} className="p-6 flex flex-col gap-6">
                  {/* Selected item summary */}
                  <div className="bg-brand-card/50 border border-brand-card-border/60 p-4 rounded-2xl flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-brand-dark/40 shrink-0">
                      <Image
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] sm:text-[10px] font-mono text-brand-violet uppercase">{selectedProduct.category}</span>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{selectedProduct.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-brand-cyan text-sm font-black">{selectedProduct.price}</span>
                        <span className="text-[11px] sm:text-[10px] text-gray-500">x 1 Unit</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Section */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold font-mono tracking-widest text-white uppercase flex items-center gap-2 border-b border-brand-card-border/50 pb-2">
                      <User className="h-3.5 w-3.5 text-brand-cyan" />
                      1. Customer Details
                    </h3>

                    {/* Name Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-mono font-medium">Full Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Satoshi Nakamoto"
                          className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-mono font-medium">Phone Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                          <Phone className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 019-2834"
                          className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Address Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-mono font-medium">Delivery Address</label>
                      <div className="relative">
                        <span className="absolute top-3.5 left-3.5 flex items-start pointer-events-none text-gray-500">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <textarea
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={3}
                          placeholder="Street, City, State, Country, Postal Code"
                          className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold font-mono tracking-widest text-white uppercase flex items-center gap-2 border-b border-brand-card-border/50 pb-2">
                      <DollarSign className="h-3.5 w-3.5 text-brand-cyan" />
                      2. Secure Payment QR
                    </h3>
                    
                    <p className="text-xs text-gray-400 leading-relaxed bg-brand-dark/40 border border-brand-card-border/40 p-3 rounded-xl">
                      Scan the QR code below to complete the transfer of <strong className="text-brand-cyan">{selectedProduct.price}</strong>. Once paid, capture a receipt screenshot and upload it below.
                    </p>

                    {/* QR Code container */}
                    <div className="flex justify-center items-center py-4 bg-brand-dark/60 rounded-2xl border border-brand-card-border relative overflow-hidden group">
                      <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-inner">
                        <Image
                          src="/qr_code_payment.png"
                          alt="RoboNexus Payment QR"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Status Alerts */}
                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex gap-3 text-red-200 text-xs items-start">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    type="submit"
                    className={`w-full rounded-2xl py-4 font-bold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isSubmitting 
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                        : "bg-gradient-to-r from-brand-cyan to-brand-purple hover:shadow-brand-cyan/20"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        Submitting Order...
                      </>
                    ) : (
                      <>
                        Submit & Make Order
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
