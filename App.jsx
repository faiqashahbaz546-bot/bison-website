import "./App.css";

function App() {
  return (
    <div className="website">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <img src="/images/bison-logo.jpg" alt="BISON Logo" />
          <span>BISON</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#men">Men</a>
          <a href="#kids">Kids</a>
          <a href="#products">Products</a>
          <a href="#contact">Contact</a>
        </div>

        <button className="shop-button">Shop Now</button>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-text">
          <p className="small-title">BISON GARMENTS</p>

          <h1>
            STYLE WITH
            <br />
            CONFIDENCE
          </h1>

          <p>
            Quality garments for men and kids.
            Modern style, comfortable fits and reliable quality.
          </p>

          <button className="red-button">EXPLORE COLLECTION</button>
        </div>

        <div className="hero-logo">
          <img src="/images/bison-logo.jpg" alt="BISON Brand Logo" />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <p className="section-label">SHOP</p>
        <h2>Our Categories</h2>

        <div className="categories">

          <div className="category-card" id="men">
            <div className="category-number">01</div>
            <h3>MEN</h3>
            <p>Shirts, trousers, jackets and more.</p>
            <button>View Collection →</button>
          </div>

          <div className="category-card" id="kids">
            <div className="category-number">02</div>
            <h3>KIDS</h3>
            <p>Comfortable and stylish clothing for kids.</p>
            <button>View Collection →</button>
          </div>

        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section" id="products">

        <p className="section-label">BISON COLLECTION</p>
        <h2>Featured Products</h2>

        <div className="products">

          <div className="product-card">
            <div className="product-image">👕</div>
            <span>MEN</span>
            <h3>Casual Shirt</h3>
            <p className="price">Rs. 2,499</p>
            <button>Add to Cart</button>
          </div>

          <div className="product-card">
            <div className="product-image">👔</div>
            <span>MEN</span>
            <h3>Formal Shirt</h3>
            <p className="price">Rs. 2,999</p>
            <button>Add to Cart</button>
          </div>

          <div className="product-card">
            <div className="product-image">🧥</div>
            <span>MEN</span>
            <h3>Premium Jacket</h3>
            <p className="price">Rs. 4,999</p>
            <button>Add to Cart</button>
          </div>

          <div className="product-card">
            <div className="product-image">🧒</div>
            <span>KIDS</span>
            <h3>Kids Outfit</h3>
            <p className="price">Rs. 1,999</p>
            <button>Add to Cart</button>
          </div>

        </div>
      </section>

      {/* BANNER */}
      <section className="banner">
        <p>BISON GARMENTS</p>
        <h2>QUALITY • STYLE • CONFIDENCE</h2>
        <button>SHOP NOW</button>
      </section>

      {/* ABOUT */}
      <section className="about">
        <div>
          <p className="section-label">ABOUT US</p>
          <h2>BISON</h2>
        </div>

        <p>
          BISON provides quality garments with a focus on comfort,
          style and reliable clothing for men and kids.
        </p>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">

        <div className="footer-logo">
          <img src="/images/bison-logo.jpg" alt="BISON Logo" />
          <h2>BISON</h2>
        </div>

        <div>
          <h3>Contact</h3>
          <p>📞 0322 4510990</p>
          <p>📞 0300 4216542</p>
        </div>

        <div>
          <h3>Address</h3>
          <p>221-1-B-2 Township</p>
          <p>Lahore, Pakistan</p>
        </div>

      </section>

      <div className="copyright">
        © 2026 BISON. All Rights Reserved.
      </div>

    </div>
  );
}

export default App;