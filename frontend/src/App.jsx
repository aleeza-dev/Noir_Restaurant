
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  ShoppingBag,
  Clock3,
  MapPin,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import "./App.css";

const dishes = [
  {
    id: 1,
    name: "Truffle Butter Steak",
    category: "Signature",
    price: 4200,
    description:
      "Premium grilled steak, truffle butter and seasonal vegetables.",
    image: "photo-1546833999-b9f581a1996d",
  },
  {
    id: 2,
    name: "Velvet Mushroom Risotto",
    category: "Vegetarian",
    price: 2400,
    description:
      "Creamy arborio rice, wild mushrooms and aged parmesan.",
    image: "photo-1476124369491-e7addf5db371",
  },
  {
    id: 3,
    name: "Golden Crusted Salmon",
    category: "Signature",
    price: 3400,
    description:
      "Pan-seared salmon with herbs and a silky lemon sauce.",
    image: "photo-1467003909585-2f8a72700288",
  },
  {
    id: 4,
    name: "Dark Chocolate Symphony",
    category: "Desserts",
    price: 1600,
    description:
      "Decadent chocolate dessert with seasonal berries.",
    image: "photo-1578985545062-69928b1d9587",
  },
  {
    id: 5,
    name: "Burrata Garden Salad",
    category: "Vegetarian",
    price: 1900,
    description:
      "Fresh greens, creamy burrata and a balsamic glaze.",
    image: "photo-1512621776951-a57141f2eefd",
  },
  {
    id: 6,
    name: "Midnight Tiramisu",
    category: "Desserts",
    price: 1400,
    description:
      "Espresso-soaked layers with delicate mascarpone cream.",
    image: "photo-1571877227200-a0d98ea607e9",
  },
];

const imageUrl = (id, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const money = (amount) =>
  "Rs. " + amount.toLocaleString("en-PK");

function App() {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderType: "delivery",
    address: "",
  });

  const [reservationForm, setReservationForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    notes: "",
  });

  const [reservationSubmitted, setReservationSubmitted] =
    useState(false);

  const visibleDishes = dishes.filter(
    (dish) =>
      category === "All" || dish.category === category
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function addToCart(dish) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === dish.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === dish.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...current, { ...dish, qty: 1 }];
    });
  }

  function changeQty(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty + amount }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function handleReservationChange(e) {
    const { name, value } = e.target;

    setReservationForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleReservationSubmit(e) {
    e.preventDefault();
    setReservationSubmitted(true);
  }

  function handleNewReservation() {
    setReservationForm({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      guests: "2",
      notes: "",
    });

    setReservationSubmitted(false);
  }


  async function handlePlaceOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
      setOrderError("Your bag is empty. Please add a dish first.");
      return;
    }

    setOrderLoading(true);
    setOrderError("");

    const orderType = checkoutForm.orderType;

    const payload = {
      customer: {
        name: checkoutForm.name.trim(),
        email: checkoutForm.email.trim(),
        phone: checkoutForm.phone.trim(),
      },
      orderType,
      address:
        orderType === "delivery"
          ? checkoutForm.address.trim()
          : "",
      paymentMethod:
        orderType === "delivery" ? "cod" : "pickup",
      items: cart.map((item) => ({
        dishId: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      })),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://noir-restaurant.onrender.com"}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to place your order. Please try again."
        );
      }

      setOrderConfirmation({
        id: data.order?._id || data.orderId || data._id || "",
        total: data.order?.total ?? data.total ?? subtotal,
        status: data.order?.status || data.status || "Pending",
      });

      setCart([]);
    } catch (error) {
      setOrderError(
        error.message ||
          "Could not connect to the server. Please try again."
      );
    } finally {
      setOrderLoading(false);
    }
  }



  function formatReservationTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <>
      <div className="announcement">
        AN EVENING WORTH REMEMBERING
        <span> · </span>
        RESERVATIONS NOW OPEN
      </div>

      <header className="navbar">
        <a href="#home" className="brand">
          NOIR<span>.</span>
          <small>FINE DINING</small>
        </a>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>

        <nav
          className={
            mobileMenu ? "nav-links open" : "nav-links"
          }
        >
          <a href="#home" onClick={() => setMobileMenu(false)}>
            Home
          </a>
          <a href="#story" onClick={() => setMobileMenu(false)}>
            Our Story
          </a>
          <a href="#menu" onClick={() => setMobileMenu(false)}>
            The Menu
          </a>
          <a
            href="#reservation"
            onClick={() => setMobileMenu(false)}
          >
            Reservations
          </a>
        </nav>

        <button
          className="cart-button"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag size={17} />
          <span>Bag ({cartCount})</span>
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image" />
          <div className="hero-overlay" />

          <div className="hero-content">
            <p className="eyebrow">
              <span /> AN ART OF ITS OWN <span />
            </p>

            <h1>
              Taste the
              <br />
              <em>extraordinary.</em>
            </h1>

            <p className="hero-description">
              An intimate dining experience where exceptional
              ingredients, thoughtful craft and unforgettable
              moments come together.
            </p>

            <div className="hero-actions">
              <a href="#menu" className="btn-gold">
                Explore the menu <ArrowRight size={17} />
              </a>

              <a href="#reservation" className="btn-outline">
                Reserve a table
              </a>
            </div>
          </div>

          <div className="hero-bottom">
            <span>CRAFTED WITH INTENTION</span>
            <a href="#story">
              DISCOVER NOIR <ArrowDown size={15} />
            </a>
            <span>EST. 2026 · PAKISTAN</span>
          </div>
        </section>

        <section
          className="intro section-padding"
          id="story"
        >
          <div className="intro-image-wrap">
            <img
              src={imageUrl("photo-1414235077428-338989a2e8c0")}
              alt="Elegant fine dining table setting"
            />

            <div className="image-stamp">
              <span>THE ART</span>
              <span>OF DINING</span>
              <span className="stamp-star">✳</span>
            </div>
          </div>

          <div className="intro-copy">
            <p className="eyebrow dark-eyebrow">
              A DIFFERENT KIND OF EVENING
            </p>

            <h2>
              More than a meal.
              <br />
              <em>A lasting memory.</em>
            </h2>

            <p>
              At NOIR, dining is an experience to be savoured.
              Every plate begins with carefully chosen ingredients
              and ends with a moment worth coming back for.
            </p>

            <p>
              Thoughtful hospitality, intimate surroundings and a
              menu inspired by the beauty of simplicity.
            </p>

            <a href="#menu" className="text-link">
              Discover our philosophy{" "}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section
          className="menu-section section-padding"
          id="menu"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow dark-eyebrow">
                CURATED FOR YOUR PLEASURE
              </p>
              <h2>
                The <em>menu.</em>
              </h2>
            </div>

            <p>
              Seasonal inspiration. Exceptional ingredients.
              An experience in every bite.
            </p>
          </div>

          <div className="category-tabs">
            {[
              "All",
              "Signature",
              "Vegetarian",
              "Desserts",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={category === item ? "active" : ""}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="dish-grid">
            {visibleDishes.map((dish) => (
              <article className="dish-card" key={dish.id}>
                <div className="dish-image">
                  <img
                    src={imageUrl(dish.image)}
                    alt={dish.name}
                    loading="lazy"
                  />

                  <span className="dish-category">
                    {dish.category}
                  </span>

                  <button
                    className="add-dish"
                    onClick={() => addToCart(dish)}
                    aria-label={`Add ${dish.name} to bag`}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="dish-info">
                  <div>
                    <h3>{dish.name}</h3>
                    <p>{dish.description}</p>
                  </div>

                  <span className="dish-price">
                    {money(dish.price)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <p className="menu-note">
            <Sparkles size={15} />
            Menu and prices are demonstration content.
          </p>
        </section>

        <section className="experience">
          <div className="experience-image" />

          <div className="experience-content">
            <p className="eyebrow">YOUR TABLE IS WAITING</p>

            <h2>
              Make room for
              <br />
              <em>something special.</em>
            </h2>

            <p>
              Whether it is an intimate dinner or a celebration,
              let us make your next evening extraordinary.
            </p>

            <a href="#reservation" className="btn-gold">
              Plan your evening <ArrowRight size={17} />
            </a>
          </div>
        </section>

        <section
          className="reservation section-padding"
          id="reservation"
        >
          <p className="eyebrow dark-eyebrow">
            AN INVITATION TO INDULGE
          </p>

          <h2>
            Reserve <em>your table.</em>
          </h2>

          <p>
            A few details are all we need to begin preparing your
            experience.
          </p>

          <div className="reservation-details">
            <span>
              <Clock3 size={17} />
              Tue – Sun · 6 PM – 11 PM
            </span>

            <span>
              <MapPin size={17} />
              Pakistan · Exact location coming soon
            </span>
          </div>

          {reservationSubmitted ? (
            <div className="reservation-success">
              <div className="success-icon">✳</div>

              <p className="eyebrow dark-eyebrow">
                YOUR EVENING STARTS HERE
              </p>

              <h3>
                Thank you, <em>{reservationForm.name}.</em>
              </h3>

              <p className="success-description">
                Your reservation request has been received in this
                demo. We look forward to making your evening special.
              </p>

              <div className="success-summary">
                <p>
                  <strong>Date: </strong>
                  <span>{reservationForm.date}</span>
                </p>

                <p>
                  <strong>Time: </strong>
                  <span>
                    {formatReservationTime(reservationForm.time)}
                  </span>
                </p>

                <p>
                  <strong>Guests: </strong>
                  <span>
                    {reservationForm.guests}{" "}
                    {reservationForm.guests === "1"
                      ? "guest"
                      : "guests"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                className="btn-dark"
                onClick={handleNewReservation}
              >
                Make Another Reservation{" "}
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <form
              className="booking-form"
              onSubmit={handleReservationSubmit}
            >
              <div className="form-grid">
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  autoComplete="name"
                  value={reservationForm.name}
                  onChange={handleReservationChange}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={reservationForm.email}
                  onChange={handleReservationChange}
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  autoComplete="tel"
                  value={reservationForm.phone}
                  onChange={handleReservationChange}
                  required
                />

                <input
                  type="date"
                  name="date"
                  min={minDate}
                  value={reservationForm.date}
                  onChange={handleReservationChange}
                  required
                />

                <select
                  name="time"
                  value={reservationForm.time}
                  onChange={handleReservationChange}
                  required
                >
                  <option value="">Select time</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="21:00">9:00 PM</option>
                  <option value="22:00">10:00 PM</option>
                </select>

                <select
                  name="guests"
                  value={reservationForm.guests}
                  onChange={handleReservationChange}
                  required
                >
                  <option value="1">1 guest</option>
                  <option value="2">2 guests</option>
                  <option value="3">3 guests</option>
                  <option value="4">4 guests</option>
                  <option value="5">5 guests</option>
                  <option value="6">6 guests</option>
                </select>
              </div>

              <textarea
                name="notes"
                placeholder="Special requests (optional)"
                rows="3"
                value={reservationForm.notes}
                onChange={handleReservationChange}
              />

              <button type="submit" className="btn-dark">
                Request a Reservation{" "}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <a href="#home" className="brand footer-brand">
          NOIR<span>.</span>
          <small>FINE DINING</small>
        </a>

        <p>An evening worth remembering.</p>

        <div className="footer-links">
          <a href="#story">Our story</a>
          <a href="#menu">Menu</a>
          <a href="#reservation">Reservations</a>
        </div>

        <small>
          © 2026 NOIR. A restaurant.
        </small>
      </footer>

      {cartOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <p className="eyebrow dark-eyebrow">
                  YOUR SELECTION
                </p>
                <h2>
                  Your <em>bag.</em>
                </h2>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close bag"
              >
                <X />
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart">
                Your bag is waiting for something delicious.
              </p>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img
                      src={imageUrl(item.image, 200)}
                      alt={item.name}
                    />

                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p>{money(item.price)}</p>

                      <div className="qty-controls">
                        <button
                          onClick={() =>
                            changeQty(item.id, -1)
                          }
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus size={14} />
                        </button>

                        <span>{item.qty}</span>

                        <button
                          onClick={() =>
                            changeQty(item.id, 1)
                          }
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="cart-total">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                
<button
  type="button"
  className="btn-dark checkout-btn"
  disabled={cart.length === 0}
  onClick={() => {
    setCartOpen(false);
    setCheckoutOpen(true);
    setOrderError("");
    setOrderConfirmation(null);
  }}
>
  Continue to checkout <ArrowRight size={17} />
</button>

              </div>
            )}
          </aside>
        </div>
      )}
      
{checkoutOpen && (
  <div
    className="checkout-backdrop"
    onClick={() => {
      if (!orderLoading) setCheckoutOpen(false);
    }}
  >
    <section
      className="checkout-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="checkout-header">
        <div>
          <p className="eyebrow dark-eyebrow">
            THE NOIR EXPERIENCE
          </p>
          <h2 id="checkout-title">
            {orderConfirmation
              ? "Order confirmed."
              : "Complete your order."}
          </h2>
        </div>

        {!orderLoading && (
          <button
            type="button"
            className="checkout-close"
            onClick={() => setCheckoutOpen(false)}
            aria-label="Close checkout"
          >
            <X />
          </button>
        )}
      </div>

      {orderConfirmation ? (
        <div className="order-success">
          <div className="order-success-icon">✳</div>

          <p className="eyebrow dark-eyebrow">
            THANK YOU FOR CHOOSING NOIR
          </p>

          <h3>Your order is received.</h3>

          <p>
            Thank you, {checkoutForm.name}. Your order has been
            saved successfully.
          </p>

          {orderConfirmation.id && (
            <p className="order-reference">
              Order reference: {orderConfirmation.id}
            </p>
          )}

          <div className="order-success-summary">
            <span>Order total</span>
            <strong>{money(orderConfirmation.total)}</strong>

            <span>Payment</span>
            <strong>
              {checkoutForm.orderType === "delivery"
                ? "Cash on Delivery"
                : "Pay at Pickup"}
            </strong>

            <span>Status</span>
            <strong>{orderConfirmation.status}</strong>
          </div>

          <button
            type="button"
            className="btn-dark checkout-submit"
            onClick={() => {
              setCheckoutOpen(false);
              setOrderConfirmation(null);
              setCheckoutForm({
                name: "",
                email: "",
                phone: "",
                orderType: "delivery",
                address: "",
              });
            }}
          >
            Continue exploring <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <form
          className="checkout-form"
          onSubmit={handlePlaceOrder}
        >
          <div className="checkout-fields">
            <label>
              Full name
              <input
                type="text"
                name="checkout-name"
                autoComplete="name"
                placeholder="Your full name"
                value={checkoutForm.name}
                onChange={(e) =>
                  setCheckoutForm((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                name="checkout-email"
                autoComplete="email"
                placeholder="you@example.com"
                value={checkoutForm.email}
                onChange={(e) =>
                  setCheckoutForm((current) => ({
                    ...current,
                    email: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Phone number
              <input
                type="tel"
                name="checkout-phone"
                autoComplete="tel"
                placeholder="Your contact number"
                value={checkoutForm.phone}
                onChange={(e) =>
                  setCheckoutForm((current) => ({
                    ...current,
                    phone: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Order type
              <select
                value={checkoutForm.orderType}
                onChange={(e) =>
                  setCheckoutForm((current) => ({
                    ...current,
                    orderType: e.target.value,
                  }))
                }
              >
                <option value="delivery">Home delivery</option>
                <option value="pickup">Restaurant pickup</option>
              </select>
            </label>

            {checkoutForm.orderType === "delivery" && (
              <label>
                Delivery address
                <textarea
                  name="checkout-address"
                  autoComplete="street-address"
                  placeholder="Enter your complete delivery address"
                  rows={3}
                  value={checkoutForm.address}
                  onChange={(e) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      address: e.target.value,
                    }))
                  }
                  required
                />
              </label>
            )}
          </div>

          <div className="checkout-payment">
            <p className="eyebrow dark-eyebrow">
              PAYMENT METHOD
            </p>

            <div className="payment-option">
              <span className="payment-symbol">✳</span>
              <div>
                <strong>
                  {checkoutForm.orderType === "delivery"
                    ? "Cash on Delivery"
                    : "Pay at Pickup"}
                </strong>
                <p>
                  {checkoutForm.orderType === "delivery"
                    ? "Pay when your order arrives."
                    : "Pay when you collect your order."}
                </p>
              </div>
            </div>
          </div>

          <div className="checkout-order-summary">
            <div className="checkout-summary-heading">
              <h3>Your selection</h3>
              <span>
                {cart.reduce((sum, item) => sum + item.qty, 0)} items
              </span>
            </div>

            {cart.map((item) => (
              <div className="checkout-line" key={item.id}>
                <span>
                  {item.name} × {item.qty}
                </span>
                <strong>{money(item.price * item.qty)}</strong>
              </div>
            ))}

            <div className="checkout-grand-total">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <p className="checkout-small-note">
              Final order total is verified by the server.
              Any delivery fee must be configured separately.
            </p>
          </div>

          {orderError && (
            <p className="checkout-error" role="alert">
              {orderError}
            </p>
          )}

          <button
            type="submit"
            className="btn-dark checkout-submit"
            disabled={orderLoading || cart.length === 0}
          >
            {orderLoading
              ? "Placing your order..."
              : "Place Order"}
            {!orderLoading && <ArrowRight size={17} />}
          </button>

          <p className="checkout-terms">
            By placing your order, you confirm that your details
            are correct.
          </p>
        </form>
      )}
    </section>
  </div>
)}
</>
);
}

export default App;

    
