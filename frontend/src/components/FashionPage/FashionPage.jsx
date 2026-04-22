import React, { useState, useEffect } from "react";
import { Clock, Shield, Truck, Zap, Heart } from "lucide-react";
import { watchOfferBannerStyles } from "../../assets/dummyStyles";

const WatchOfferBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    Days: 2,
    Hours: 12,
    Minutes: 45,
    Seconds: 18,
  });

  useEffect(() => {
    // Convert current state to total seconds helper
    const toTotalSeconds = (t) =>
      t.Days * 86400 + t.Hours * 3600 + t.Minutes * 60 + t.Seconds;

    // Create interval
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const total = toTotalSeconds(prev);

        // If already zero, clear and return zeros
        if (total <= 0) {
          clearInterval(timer);
          return { Days: 0, Hours: 0, Minutes: 0, Seconds: 0 };
        }

        const nextTotal = total - 1;

        const Days = Math.floor(nextTotal / 86400);
        const Hours = Math.floor((nextTotal % 86400) / 3600);
        const Minutes = Math.floor((nextTotal % 3600) / 60);
        const Seconds = Math.floor(nextTotal % 60);

        return { Days, Hours, Minutes, Seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={watchOfferBannerStyles.container}>
      <div className={watchOfferBannerStyles.maxWidthContainer}>
        {/* Banner */}
        <div className={watchOfferBannerStyles.banner}>
          {/* Content Section */}
          <div className={watchOfferBannerStyles.contentSection}>
            {/* Decorative elements */}
            <div className={watchOfferBannerStyles.decorativeLarge}></div>
            <div className={watchOfferBannerStyles.decorativeSmall}></div>

            {/* Offer tag */}
            <div
              className={watchOfferBannerStyles.offerTag}
              style={watchOfferBannerStyles.playfairFont}
            >
              Limited Time Offer
            </div>

            {/* Heading */}
            <h1
              className={watchOfferBannerStyles.heading}
              style={watchOfferBannerStyles.playfairFont}
            >
              Premium <span className={watchOfferBannerStyles.headingAccent}>Luxury Watches</span>{" "}
              Collection
            </h1>

            {/* Description */}
            <p className={watchOfferBannerStyles.description}>
              Discover our exclusive selection of premium timepieces with
              special discounts up to 30% off. Elevate your style with precision
              craftsmanship.
            </p>

            {/* Countdown Timer */}
            <div className={watchOfferBannerStyles.countdownGrid}>
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div
                  key={unit}
                  className={watchOfferBannerStyles.countdownItem}
                >
                  <div className={watchOfferBannerStyles.countdownValue}>
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className={watchOfferBannerStyles.countdownLabel}>
                    {unit}
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className={watchOfferBannerStyles.featuresContainer}>
              <div className={watchOfferBannerStyles.featureItem}>
                <Truck size={18} className={watchOfferBannerStyles.featureIcon} />
                <span className={watchOfferBannerStyles.featureText}>
                  Free Shipping
                </span>
              </div>
              <div className={watchOfferBannerStyles.featureItem}>
                <Shield size={18} className={watchOfferBannerStyles.featureIcon} />
                <span className={watchOfferBannerStyles.featureText}>
                  2-Year Warranty
                </span>
              </div>
              <div className={watchOfferBannerStyles.featureItem}>
                <Heart size={18} className={watchOfferBannerStyles.featureIcon} />
                <span className={watchOfferBannerStyles.featureText}>
                  30-Day Returns
                </span>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className={watchOfferBannerStyles.imageSection}>
            <div className={watchOfferBannerStyles.imageOverlay}></div>
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1099&q=80"
              alt="Luxury Watch"
              className={watchOfferBannerStyles.image}
            />

            {/* Price Tag */}
            <div className={watchOfferBannerStyles.priceTag}>
              <div className={watchOfferBannerStyles.oldPrice}>₹899.99</div>
              <div className={watchOfferBannerStyles.newPrice}>₹629.99</div>
              <div className={watchOfferBannerStyles.discount}>Save 30%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchOfferBanner;