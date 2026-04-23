import React from "react";
import { comingSoonStyles } from "../../assets/dummyStyles";
import CS1 from "../../assets/CS1.png";
import CS2 from "../../assets/CS2.png";
import CS3 from "../../assets/CS3.png";
import CS4 from "../../assets/CS4.png";
import CS5 from "../../assets/CS5.png";
import { Link } from "react-router-dom"; //
const watches = [
  {
    id: 1,
    name: "Norqain Independence",
    price: 619000,
    imgUrl: CS1,
  },
  {
    id: 2,
    name: "Zenith Chronomaster",
    price: 1069200,
    imgUrl: CS2,
  },
  {
    id: 3,
    name: "Jacob & Co. Epic X ",
    price: 3100000,
    imgUrl: CS3,
  },
  {
    id: 4,
    name: "Bvlgari Octo",
    price: 2450000,
    imgUrl: CS4,
  },
  {
    id: 5,
    name: "Louis Erard Excellence",
    price: 3300000,
    imgUrl: CS5,
  },
];

// Use the format function from styles
const formatINR = comingSoonStyles.formatINR;

export default function ComingSoonWatchesPage() {
  return (
    <section className={comingSoonStyles.section}>
      <div className={comingSoonStyles.container}>
        <div className={comingSoonStyles.headerContainer}>
          <div className={comingSoonStyles.titleContainer}>
            <h2
              className={comingSoonStyles.title}
              style={comingSoonStyles.titleStyle}
            >
              New Arrivals
            </h2>
            <p className={comingSoonStyles.subtitle}>
              Coming Soon
            </p>
          </div>
          <a
            className={comingSoonStyles.viewAllLink}
            href="/watches"
          >
            View All ›
          </a>
        </div>

        {/* watches row */}
        <div className={comingSoonStyles.watchesContainer}>
          <div className={comingSoonStyles.watchesRow}>
            {watches.map((w) => (
              <figure
                key={w.id}
                className={comingSoonStyles.watchItem}
              >
                {/* image - no card, no border, using image URL */}
                <Link to={`/watch/${w.id}`}>
                <div className={comingSoonStyles.imageContainer}>
                  <img
                    src={w.imgUrl}
                    alt={w.name}
                    className={comingSoonStyles.image}
                    loading="lazy"
                    onError={(e) => {
                      // fallback: show a small transparent placeholder if URL is missing
                      e.currentTarget.src =
                        "data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22240%22></svg>";
                    }}
                  />
                </div>
                </Link>

                {/* name */}
                <figcaption className={comingSoonStyles.figcaption}>
                  <Link to={`/watch/${w.id}`}>
                  <div className={comingSoonStyles.watchName}>
                    {w.name}
                  </div>
                  </Link>
                  <div className={comingSoonStyles.price}>
                    {formatINR(w.price)}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}