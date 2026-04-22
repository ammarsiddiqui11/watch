// ContactPage.jsx
import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingCart,
  Send,
  AlertCircle,
  Check,
  User,
  IndianRupee,
} from "lucide-react";
import { contactPageStyles } from "../../assets/dummyStyles";

export default function ContactPage() {
  // Put your business WhatsApp number (country code + number, no '+')
  const WHATSAPP_NUMBER = "918299431275";

  const initialForm = {
    name: "",
    email: "",
    phone: "",
    product: "General Inquiry",
    budget: "",
    contactMethod: "WhatsApp",
    message: "",
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const products = [
    "General Inquiry",
    "Norqain Independence",
    "Zenith Chronomaster",
    "Jacob & Co. Epic X",
    "Bvlgari Octo",
    "H. Moser Endeavour",
  ];

  // show toast
  function showToast(text, kind = "info", duration = 1800) {
    setToast({ text, kind });
    setTimeout(() => setToast(null), duration);
  }

  // strict validation: all fields required
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email is invalid";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.product.trim()) e.product = "Select product";
    if (!form.budget.trim()) e.budget = "Budget is required";
    if (!form.contactMethod.trim()) e.contactMethod = "Select contact method";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setErrors((s) => ({ ...s, [name]: undefined }));
  }

  function clearForm() {
    setForm(initialForm);
    setErrors({});
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setSending(true);

    // Build WhatsApp message (formatted)
    const message =
      `Hello! I am *${form.name}*.\n\n` +
      `📌 *Interest:* ${form.product}\n` +
      `💰 *Budget:* ${form.budget}\n` +
      `📞 *Phone:* ${form.phone}\n` +
      `✉️ *Email:* ${form.email}\n` +
      `📬 *Preferred Contact:* ${form.contactMethod}\n\n` +
      `📝 *Message:* ${form.message}`;

    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
      message
    )}`;

    showToast("Opening WhatsApp...", "success", 900);

    setTimeout(() => {
      window.open(url, "_blank");
      clearForm();
      setSending(false);
      showToast("Submitted — form cleared", "success", 1600);
    }, 700);
  }

  return (
    <div className={contactPageStyles.pageContainer}>
      <div className={contactPageStyles.innerContainer}>
        {/* Page header */}
        <div className={contactPageStyles.pageHeader}>
          <h1
            className={contactPageStyles.pageTitle}
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Get in touch
          </h1>
          <p
            className={contactPageStyles.pageSubtitle}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Looking for a watch, quote or consultation? Fill the form — we'll
            reply on WhatsApp with details.
          </p>
        </div>

        {/* Grid: left form on top for tablet, right box below on tablet, and two-column layout on lg (1024px) */}
        {/* Key change: use single-column layout up through md so form is above and the right box sits below and is left-aligned.
            On lg we return to the 12-column layout with original lg:col-span values. */}
        <div className={contactPageStyles.mainGrid}>
          {/* LEFT: FORM (spans 7 cols on large). On small & md, placed first (order-1) so form appears above. */}
          <div className={contactPageStyles.leftColumn}>
            <div className={contactPageStyles.formCard}>
              <form onSubmit={handleSubmit} className={contactPageStyles.form}>
                {/* Row: name / email */}
                <div className={contactPageStyles.inputGrid}>
                  <InputWithIcon
                    icon={<User className={contactPageStyles.inputIcon} />}
                    label="Your Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="FullName"
                    error={errors.name}
                    required
                  />
                  <InputWithIcon
                    icon={<Mail className={contactPageStyles.inputIcon} />}
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    error={errors.email}
                    required
                  />
                </div>

                {/* Row: phone / contact method */}
                <div className={contactPageStyles.inputGrid}>
                  <InputWithIcon
                    icon={<Phone className={contactPageStyles.inputIcon} />}
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 xxxxxx xxxxx"
                    error={errors.phone}
                    required
                  />
                  <SelectWithIcon
                    icon={<Clock className={contactPageStyles.inputIcon} />}
                    label="Preferred Contact"
                    name="contactMethod"
                    value={form.contactMethod}
                    onChange={handleChange}
                    options={["WhatsApp", "Phone Call", "Email"]}
                    error={errors.contactMethod}
                    required
                  />
                </div>

                {/* product */}
                <div>
                  <SelectWithIcon
                    icon={<ShoppingCart className={contactPageStyles.inputIcon} />}
                    label="Product of interest"
                    name="product"
                    value={form.product}
                    onChange={handleChange}
                    options={products}
                    error={errors.product}
                    required
                  />
                </div>

                {/* budget / message */}
                <div className={contactPageStyles.inputGrid}>
                  <InputWithIcon
                    icon={<IndianRupee className={`${contactPageStyles.inputIcon} text-green-600`} />}
                    label="Estimated Budget"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="e.g. ₹ 1,50,000 - ₹ 3,00,000"
                    error={errors.budget}
                    required
                  />
                  <div>
                    <label className={contactPageStyles.inputLabel}>
                      Short message <span className={contactPageStyles.requiredStar}>*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={4}
                      className={`${contactPageStyles.textareaContainer} ${
                        errors.message ? contactPageStyles.inputError : contactPageStyles.inputNormal
                      }`}
                      placeholder="Tell us what you are looking for..."
                      required
                    />
                  </div>
                </div>

                {/* actions */}
                <div className={contactPageStyles.buttonsContainer}>
                  <button
                    type="submit"
                    disabled={sending}
                    className={contactPageStyles.submitButton}
                    aria-label="Send via WhatsApp"
                  >
                    <Send className={contactPageStyles.submitIcon} />
                    <span className={contactPageStyles.submitText}>Send via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearForm();
                      showToast("Form cleared", "info");
                    }}
                    className={contactPageStyles.clearButton}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Video + Cards (spans 5 cols on large). On md it will be stacked below the form and left-aligned. */}
          <div className={contactPageStyles.rightColumn}>
            {/* Two creative info cards */}
            {/* Use items-start so cards align to the left when stacked */}
            <div className={contactPageStyles.rightColumnGrid}>
              <CreativeCard
                title="Showroom Visits"
                subtitle="Private viewings by appointment"
                icon={<MapPin className={contactPageStyles.creativeCardIcon} />}
                ctaText="Book Visit"
                ctaOnClick={() => {
                  const msg = `Hi, I'd like to book a private showroom visit.`;
                  window.open(
                    `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
                      msg
                    )}`,
                    "_blank"
                  );
                }}
                accent="amber"
              />
            </div>
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div
          className={`${contactPageStyles.toastBase} ${
            toast.kind === "error"
              ? contactPageStyles.toastError
              : contactPageStyles.toastSuccess
          }`}
        >
          {toast.kind === "success" ? (
            <Check className={contactPageStyles.toastIcon} />
          ) : (
            <AlertCircle className={contactPageStyles.toastIcon} />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600&family=Playfair+Display:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
}

/* ---------- Reusable small components below ---------- */

// Input with an icon on left
function InputWithIcon({
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required,
}) {
  return (
    <label className="block">
      <span className={contactPageStyles.inputLabel}>
        {label} {required && <span className={contactPageStyles.requiredStar}>*</span>}
      </span>
      <div className={contactPageStyles.inputContainer}>
        <div className={contactPageStyles.inputIconContainer}>
          {icon}
        </div>
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`${contactPageStyles.inputBase} ${
            error ? contactPageStyles.inputError : contactPageStyles.inputNormal
          }`}
        />
      </div>
      {error && (
        <p className={contactPageStyles.errorMessage}>
          <AlertCircle className={contactPageStyles.errorIcon} />
          {error}
        </p>
      )}
    </label>
  );
}

// Select with icon
function SelectWithIcon({
  icon,
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required,
}) {
  return (
    <label className="block">
      <span className={contactPageStyles.inputLabel}>
        {label} {required && <span className={contactPageStyles.requiredStar}>*</span>}
      </span>
      <div className={contactPageStyles.inputContainer}>
        <div className={contactPageStyles.inputIconContainer}>
          {icon}
        </div>
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`${contactPageStyles.inputBase} ${
            error ? contactPageStyles.inputError : contactPageStyles.inputNormal
          }`}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

// Creative card used on right side
function CreativeCard({
  title,
  subtitle,
  icon,
  ctaText,
  ctaOnClick,
  accent = "amber",
}) {
  // accent controls small color variants
  const accentBg =
    accent === "indigo"
      ? contactPageStyles.accentIndigo
      : contactPageStyles.accentAmber;
  const buttonClass =
    accent === "indigo"
      ? contactPageStyles.buttonIndigo
      : contactPageStyles.buttonAmber;

  return (
    <div
      className={`${contactPageStyles.creativeCardBase} ${accentBg}`}
    >
      <div className="flex items-start gap-4">
        <div className={contactPageStyles.creativeCardIconContainer}>{icon}</div>
        <div className="flex-1">
          <div
            className={contactPageStyles.creativeCardTitle}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </div>
          <p className={contactPageStyles.creativeCardSubtitle}>{subtitle}</p>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={ctaOnClick}
          className={`${contactPageStyles.creativeCardButtonBase} ${buttonClass}`}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}