import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createBooking } from "@/lib/bookings.functions";

const gallery = [
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/c4089901-ded9-4586-9770-334c8b8a4218.jpg", label: "Double-breasted tailoring" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/b10e15d3-7adb-44ca-903c-2e56959b125a.jpg", label: "Lightweight traditional form" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/f4d9144d-7725-4f4c-bf22-f10867657de2.jpg", label: "Hand-finished embroidery" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/15f23461-2e79-4877-92c6-2cfc96b46774.jpg", label: "Pressing and construction" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/abcf30d0-fb06-4bf9-932e-601c906a4dd0.jpg", label: "Signature shirt detail" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/46b4613e-bc7d-4d34-987b-5c59c1f08b26.jpg", label: "Fine white detailing" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/5e226820-a5cd-48aa-99df-22694912dfa7.jpg", label: "Textured blue fabric" },
  { src: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/8f488281-7ec2-45d8-8c1d-0cfbb10eb6d4.jpg", label: "Printed resort shirt" },
];

const services = [
  "Bespoke tailoring",
  "Traditional / native wear",
  "Corporate & occasion wear",
  "Alterations & refitting",
  "Embroidery & finishing",
];

const times = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30",
];

export const Route = createFileRoute("/")({ component: BVStitchesHome });

function BVStitchesHome() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    service: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (state !== "idle") {
      setState("idle");
      setMessage("");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("saving");
    setMessage("");
    try {
      const result = await createBooking({ data: form });
      setState("success");
      setMessage(`Booking request received. Reference: ${result.bookingId.slice(0, 8).toUpperCase()}`);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        service: "",
        preferredDate: "",
        preferredTime: "",
        notes: "",
      });
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not submit the booking. Please try again.");
    }
  };

  return (
    <main className="bv-site">
      <nav className="bv-nav" aria-label="Primary navigation">
        <a href="#top" className="bv-logo"><span>BV</span> STITCHES</a>
        <div className="bv-nav-links">
          <a href="#work">Work</a>
          <a href="#process">Process</a>
          <a href="#book">Book</a>
        </div>
        <a href="#book" className="bv-nav-cta">Book an appointment <span>↗</span></a>
      </nav>

      <section id="top" className="bv-hero">
        <div className="bv-hero-media" style={{ backgroundImage: `url(${gallery[0].src})` }} />
        <div className="bv-hero-wash" />
        <div className="bv-hero-copy">
          <p className="eyebrow">BV STITCHES / BESPOKE TAILORING</p>
          <h1>Made to fit.<br /><em>Made to stay.</em></h1>
          <p className="hero-intro">Custom tailoring, native wear and considered finishing, made around your measurements and the way you move.</p>
          <a className="hero-book" href="#book">Book a fitting <span>↗</span></a>
        </div>
        <div className="bv-hero-meta"><span>Owerri / Nigeria</span><span>Est. 2026</span></div>
      </section>

      <section className="bv-intro">
        <div className="section-number">01 / THE ATELIER</div>
        <div>
          <h2>Quietly precise.<br /><em>Distinctly yours.</em></h2>
          <p>BV Stitches creates garments where clean structure meets expressive detail. From a sharp navy suit to embroidered native pieces, every commission begins with a conversation and a careful measurement.</p>
        </div>
      </section>

      <section id="work" className="bv-work">
        <div className="work-head">
          <div><span className="section-number">02 / SELECTED WORK</span><h2>Cut.<br /><em>Stitched.</em></h2></div>
          <p>Explore recent tailoring, embroidery and finishing details from the atelier.</p>
        </div>
        <div className="bv-gallery">
          {gallery.slice(1).map((item, index) => (
            <figure key={item.src} className={index % 4 === 0 ? "gallery-card gallery-card-wide" : "gallery-card"}>
              <img src={item.src} alt={item.label} loading="lazy" />
              <figcaption><span>0{index + 1}</span><span>{item.label}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="process" className="bv-process">
        <div className="section-number">03 / THE PROCESS</div>
        <div className="process-grid">
          <article><span>01</span><h3>Tell us what you want</h3><p>Choose a service and tell us what you are making, from a complete suit to a native look or a refined alteration.</p></article>
          <article><span>02</span><h3>Come in for your fitting</h3><p>We take the measurements and discuss fabric, silhouette, details and the occasion the garment is for.</p></article>
          <article><span>03</span><h3>We build the piece</h3><p>Your garment is cut, constructed, pressed and finished before your final fitting and collection.</p></article>
        </div>
      </section>

      <section id="book" className="bv-book">
        <div className="book-copy">
          <span className="section-number">04 / APPOINTMENTS</span>
          <h2>Let's make<br /><em>something yours.</em></h2>
          <p>Request a fitting below. Your preferred time is a request until BV Stitches confirms the appointment.</p>
          <div className="book-contact">
            <a href="tel:+2349015618873">0901 561 8873</a>
            <a href="mailto:judethaddeusschibueze7@gmail.com">judethaddeusschibueze7@gmail.com</a>
            <a href="https://www.tiktok.com/@bvstitches" target="_blank" rel="noreferrer">@bvstitches on TikTok ↗</a>
          </div>
        </div>

        <form className="booking-form" onSubmit={submit}>
          <label><span>Name</span><input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Your full name" /></label>
          <div className="form-row">
            <label><span>Email</span><input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></label>
            <label><span>Phone</span><input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="090..." /></label>
          </div>
          <div className="form-row">
            <label><span>Service</span><select required value={form.service} onChange={(e) => update("service", e.target.value)}><option value="">Select a service</option>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label><span>Preferred date</span><input required type="date" min={today} value={form.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} /></label>
          </div>
          <label><span>Preferred time</span><select required value={form.preferredTime} onChange={(e) => update("preferredTime", e.target.value)}><option value="">Select a time</option>{times.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
          <label><span>Anything we should know?</span><textarea rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Event date, garment idea, special details..." /></label>
          <button className="booking-submit" disabled={state === "saving"}>{state === "saving" ? "Sending request..." : "Request appointment"} <span>↗</span></button>
          {message && <p className={`form-message form-message-${state}`} role={state === "error" ? "alert" : "status"}>{message}</p>}
        </form>
      </section>

      <footer className="bv-footer">
        <div className="bv-logo"><span>BV</span> STITCHES</div>
        <p>Tailoring with intention. Built around you.</p>
        <div><a href="tel:+2349015618873">0901 561 8873</a><a href="https://www.tiktok.com/@bvstitches" target="_blank" rel="noreferrer">TikTok ↗</a></div>
      </footer>
    </main>
  );
}
