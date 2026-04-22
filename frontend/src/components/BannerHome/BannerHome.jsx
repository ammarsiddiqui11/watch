import React, { useEffect, useRef } from "react";
import video from "../../assets/bannervideo.mp4";
import Navbar from "../Navbar/Navbar";
import { bannerHomeStyles } from "../../assets/dummyStyles";
import BL1 from "../../assets/BL1.png";
import BM1 from "../../assets/BM1.png";
import BR1 from "../../assets/BR1.png";
const BannerHome = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("autoplay");
    }
  }, []);

  return (
    <div className={bannerHomeStyles.container}>
      {/* Navbar always on top */}
      <div className={bannerHomeStyles.navbarWrapper}>
        <Navbar />
      </div>

      {/* Video background (now visible on all screens) */}
      <div className={bannerHomeStyles.videoContainer}>
        <video
          ref={videoRef}
          className={bannerHomeStyles.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/fallback.jpg"
          aria-hidden="true"
          role="presentation"
        >
          <source src={video} type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className={bannerHomeStyles.contentContainer}>
        <div className={bannerHomeStyles.h1Container}>
          <h1
            className={bannerHomeStyles.h1Text}
            style={bannerHomeStyles.playfairFont}
          >
            <span className={bannerHomeStyles.h1SpanGray}>Love you more</span>
            <span className={bannerHomeStyles.h1SpanYellow}>
              with each tick-tock
            </span>
          </h1>

          <p className={bannerHomeStyles.subtext}>
            Discover our exclusive collection of handcrafted timepieces that
            embody precision, luxury, and timeless style.
          </p>
        </div>

        {/* Cards Section */}
        <div className={bannerHomeStyles.cardsContainer}>
          <div className={bannerHomeStyles.grid}>
            {/* Left card */}
            <div className={`${bannerHomeStyles.cardWrapper} ${bannerHomeStyles.leftCardTransform}`}>
              <div className={`${bannerHomeStyles.cardBase} ${bannerHomeStyles.cardPadding}`}>
                <img
                  src={BL1}
                  alt="Luxury Watch"
                  className={`${bannerHomeStyles.cardImage} ${bannerHomeStyles.leftCardImage}`}
                  loading="lazy"
                />
              </div>
              <p className={`${bannerHomeStyles.cardLabel} ${bannerHomeStyles.cardLabelGray}`}>
                Classic Heritage
              </p>
            </div>

            {/* Middle (featured) card */}
            <div className={`${bannerHomeStyles.cardWrapper} ${bannerHomeStyles.middleCardTransform}`}>
              <div className={`${bannerHomeStyles.cardMiddle} ${bannerHomeStyles.cardPadding}`}>
                <img
                  src={BM1}
                  alt="Premium Watch"
                  className={`${bannerHomeStyles.cardImage} ${bannerHomeStyles.middleCardImage}`}
                  loading="lazy"
                />
              </div>
              <p className={`${bannerHomeStyles.cardLabel} ${bannerHomeStyles.cardLabelYellow}`}>
                Limited Edition
              </p>
            </div>

            {/* Right card */}
            <div className={`${bannerHomeStyles.cardWrapper} ${bannerHomeStyles.rightCardTransform}`}>
              <div className={`${bannerHomeStyles.cardBase} ${bannerHomeStyles.cardPadding}`}>
                <img
                  src={BR1}
                  alt="Modern Watch"
                  className={`${bannerHomeStyles.cardImage} ${bannerHomeStyles.rightCardImage}`}
                  loading="lazy"
                />
              </div>
              <p className={`${bannerHomeStyles.cardLabel} ${bannerHomeStyles.cardLabelGray}`}>
                Modern Precision
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerHome;