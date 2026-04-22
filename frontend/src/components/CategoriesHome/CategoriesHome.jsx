// src/components/CategoriesHome.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import brands from "./CategoriesHomedata";
import { categoriesHomeStyles } from "../../assets/dummyStyles";

const CategoriesHome = () => {
  const [hoveredBrand, setHoveredBrand] = useState(null);

  return (
    <section className={categoriesHomeStyles.section}>
      <div className={categoriesHomeStyles.container}>
        {/* Heading */}
        <header
          className={categoriesHomeStyles.header}
          style={categoriesHomeStyles.playfairFont}
        >
          <h1
            className={categoriesHomeStyles.h1}
            style={categoriesHomeStyles.h1FontSize}
          >
            <span className={categoriesHomeStyles.h1SpanRegular}>Premium Watch</span>
            <span className={categoriesHomeStyles.h1SpanAccent}>Brands</span>
          </h1>
          <div className={categoriesHomeStyles.underline} />
          <p className={categoriesHomeStyles.subtext}>
            Discover the world's most prestigious watchmakers — curated picks
            for every style.
          </p>
        </header>

        {/* Grid: mobile-first → sm:3 → md:4 → lg:5 */}
        <div
          className={categoriesHomeStyles.grid}
          style={categoriesHomeStyles.playfairFont}
        >
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={brand.link}
              className={categoriesHomeStyles.cardLink}
              onMouseEnter={() => setHoveredBrand(brand.id)}
              onMouseLeave={() => setHoveredBrand(null)}
            >
              {/* Card wrapper */}
              <div className={categoriesHomeStyles.cardWrapper}>
                {/* Image container */}
                <div className={categoriesHomeStyles.imageContainer}>
                  <img
                    src={brand.image}
                    alt={brand.name}
                    loading="lazy"
                    className={categoriesHomeStyles.image}
                  />
                </div>

                {/* Brand name + meta */}
                <div className={categoriesHomeStyles.cardContent}>
                  <h3
                    className={`${categoriesHomeStyles.cardTitleBase} ${
                      hoveredBrand === brand.id
                        ? categoriesHomeStyles.cardTitleHover
                        : categoriesHomeStyles.cardTitleNormal
                    }`}
                  >
                    {brand.name}
                  </h3>
                  {brand.tagline ? (
                    <p className={categoriesHomeStyles.cardTagline}>
                      {brand.tagline}
                    </p>
                  ) : null}
                </div>

                {/* Focus ring */}
                <span
                  className={categoriesHomeStyles.focusRing}
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Extra responsive helpers */}
      <style>{`
        @media (max-height: 500px) {
          .aspect-square {
            min-height: 120px;
          }
        }
        @media (max-width: 360px) {
          .gap-4 {
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
};

export default CategoriesHome;