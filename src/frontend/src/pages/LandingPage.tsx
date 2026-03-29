import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import PaymentModal from "../components/PaymentModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const PRODUCTS = [
  {
    id: 1n,
    name: "Starter Pack",
    price: 1500n,
    description:
      "Start your earning journey with a simple, beginner-friendly digital product. One-time purchase with fast approval.",
    color: "cyan",
  },
  {
    id: 2n,
    name: "Growth Pack",
    price: 3000n,
    description:
      "Accelerate your income with higher referral returns. Secure system, instant activation after approval.",
    color: "violet",
  },
  {
    id: 3n,
    name: "Pro Pack",
    price: 5000n,
    description:
      "Maximize your earning potential with premium referral benefits. Trusted by thousands of active earners.",
    color: "magenta",
  },
  {
    id: 4n,
    name: "Elite Pack",
    price: 8000n,
    description:
      "Top-tier plan for serious earners. Maximum commissions, priority approval, long-term earning potential.",
    color: "cyan",
  },
];

const GLOW_COLORS: Record<string, string> = {
  cyan: "rgba(38,214,255,0.35)",
  violet: "rgba(123,77,255,0.35)",
  magenta: "rgba(201,60,255,0.35)",
};

const BORDER_COLORS: Record<string, string> = {
  cyan: "rgba(38,214,255,0.25)",
  violet: "rgba(123,77,255,0.25)",
  magenta: "rgba(201,60,255,0.25)",
};

const TEXT_CLASSES: Record<string, string> = {
  cyan: "neon-text-cyan",
  violet: "neon-text-violet",
  magenta: "neon-text-magenta",
};

type Product = (typeof PRODUCTS)[0];

export default function LandingPage() {
  const { identity, login } = useInternetIdentity();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleBuyNow = (product: Product) => {
    if (!identity) {
      login();
      return;
    }
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36 overflow-hidden">
        {/* Background glow blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: "oklch(0.52 0.22 280)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none"
          style={{ background: "oklch(0.82 0.18 210)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
            style={{
              background: "rgba(38,214,255,0.1)",
              border: "1px solid rgba(38,214,255,0.3)",
              color: "oklch(0.82 0.18 210)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Referral System Active — Earn 20% Per Sale
          </motion.div>

          <h1 className="font-display font-black text-5xl sm:text-7xl leading-tight mb-6">
            <span className="gradient-text">Earn 20% On</span>
            <br />
            <span className="text-foreground">Every Referral</span>
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Buy once. Refer friends. Earn real money — 20% commission for every
            friend who joins and purchases a plan.
          </p>

          <a
            href="#products"
            className="neon-btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-semibold"
            data-ocid="hero.primary_button"
          >
            View Plans
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10 mt-16 flex flex-wrap justify-center gap-8 sm:gap-16"
        >
          {[
            { label: "Active Users", value: "2,400+" },
            { label: "Commission Rate", value: "20%" },
            { label: "Cashback", value: "10%" },
            { label: "Approval Time", value: "< 24h" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display font-black text-2xl neon-text-cyan">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section id="products" className="px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-display font-black text-4xl sm:text-5xl mb-4">
            <span className="gradient-text">Choose Your Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            One-time purchase. Activate your referral link after approval and
            start earning 20% commission instantly.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {PRODUCTS.map((product, i) => (
              <motion.div
                key={product.id.toString()}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="relative w-72 max-w-full rounded-2xl p-6 flex flex-col transition-shadow duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
                  border: `1px solid ${BORDER_COLORS[product.color]}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    `0 8px 30px ${GLOW_COLORS[product.color]}, 0 4px 20px rgba(0,0,0,0.5)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.4)";
                }}
                data-ocid={`products.card.${i + 1}`}
              >
                {/* Cashback badge */}
                <div
                  className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(52,211,153,0.15)",
                    border: "1px solid rgba(52,211,153,0.4)",
                    color: "rgb(52,211,153)",
                    boxShadow: "0 0 10px rgba(52,211,153,0.3)",
                  }}
                >
                  10% Cashback
                </div>

                {/* Product title */}
                <h3
                  className={`font-display font-bold text-lg mb-3 ${TEXT_CLASSES[product.color]}`}
                >
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-display font-black text-4xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {product.description}
                </p>

                {/* Referral commission callout */}
                <div
                  className="rounded-xl px-3 py-2.5 mb-5 text-xs leading-relaxed"
                  style={{
                    background: "rgba(52,211,153,0.06)",
                    border: "1px solid rgba(52,211,153,0.25)",
                    boxShadow: "0 0 12px rgba(52,211,153,0.08)",
                    color: "rgba(52,211,153,0.9)",
                  }}
                >
                  🤝 Buy this product and share with your friends. When your
                  friend signs up and purchases any product, you will earn{" "}
                  <strong>20% commission</strong>.
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-6 flex-1">
                  {[
                    "One-time purchase",
                    "Beginner-friendly",
                    "Referral earnings",
                    "Secure & fast",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Buy button */}
                <button
                  type="button"
                  onClick={() => handleBuyNow(product)}
                  className="neon-btn-primary w-full py-3 text-sm font-semibold"
                  data-ocid={`products.primary_button.${i + 1}`}
                >
                  Buy Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-black text-3xl sm:text-4xl text-center mb-14 gradient-text"
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Buy a Plan",
                desc: "Select any plan and complete payment via QR code. Submit your transaction ID and screenshot.",
                color: "cyan",
              },
              {
                step: "02",
                title: "Get Approved",
                desc: "Admin verifies and approves your payment within 24 hours. Your referral link activates instantly.",
                color: "violet",
              },
              {
                step: "03",
                title: "Earn 20%",
                desc: "Share your referral link. Earn 20% commission on every friend who purchases and gets approved.",
                color: "magenta",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="neon-card p-6 text-center"
              >
                <div
                  className={`font-display font-black text-5xl mb-4 ${TEXT_CLASSES[item.color]}`}
                  style={{ opacity: 0.3 }}
                >
                  {item.step}
                </div>
                <h3
                  className={`font-display font-bold text-lg mb-2 ${TEXT_CLASSES[item.color]}`}
                >
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <PaymentModal
            product={{
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              description: selectedProduct.description,
              features: [],
            }}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
