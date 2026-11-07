import React, { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Send,
  User,
  Mail,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

import "./support-form.css";

const initialForm = {
  name: "",
  email: "",
  category: "General Enquiry",
  priority: "Normal",
  subject: "",
  message: "",
};

const categories = [
  "General Enquiry",
  "Membership",
  "Events & Workshops",
  "Hackathons",
  "Projects & Research",
  "Technical Issue",
  "Collaboration",
  "Feedback",
  "Other",
];

export default function SupportForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (status) setStatus("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // The form UI is ready. Connect this handler to your backend/API
    // before accepting and delivering real support requests.
    setStatus(
      "Your form is filled in, but message delivery is not configured yet. Please connect the support API before publishing this form."
    );
  };

  return (
    <section className="support-form-section" id="support-form">
      <div className="support-form-section__inner">
        <div className="support-form-section__intro">
          <span className="support-form-section__eyebrow">
            SEND US A MESSAGE
          </span>

          <h2>
            Tell us what's
            <br />
            <span>on your mind.</span>
          </h2>

          <p>
            Whether it's a question, a technical issue or an idea you'd
            like to share, give us a few details below.
          </p>

          <div className="support-form-section__note">
            <div className="support-form-section__note-icon">
              <MessageSquare size={19} />
            </div>

            <div>
              <strong>A little more detail goes a long way.</strong>
              <p>
                Include relevant information so the team can understand
                your request.
              </p>
            </div>
          </div>

          <div className="support-form-section__decor">
            <span>PRISM AI</span>
            <div />
            <span>HERE TO HELP</span>
          </div>
        </div>

        <form
          className="support-form"
          onSubmit={handleSubmit}
        >
          <div className="support-form__header">
            <div>
              <span>SUPPORT REQUEST</span>
              <h3>Let's get started.</h3>
            </div>

            <div className="support-form__header-icon">
              <Send size={19} />
            </div>
          </div>

          <div className="support-form__grid">
            <div className="support-form__field">
              <label htmlFor="support-name">Your name *</label>
              <div className="support-form__input-wrap">
                <User size={16} />
                <input
                  id="support-name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="support-form__field">
              <label htmlFor="support-email">Email address *</label>
              <div className="support-form__input-wrap">
                <Mail size={16} />
                <input
                  id="support-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="support-form__field">
              <label htmlFor="support-category">What is this about? *</label>
              <div className="support-form__input-wrap">
                <MessageSquare size={16} />
                <select
                  id="support-category"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="support-form__select-icon" />
              </div>
            </div>

            <div className="support-form__field">
              <label htmlFor="support-priority">Priority</label>
              <div className="support-form__input-wrap">
                <AlertCircle size={16} />
                <select
                  id="support-priority"
                  name="priority"
                  value={form.priority}
                  onChange={updateField}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown size={15} className="support-form__select-icon" />
              </div>
            </div>
          </div>

          <div className="support-form__field">
            <label htmlFor="support-subject">Subject *</label>
            <input
              className="support-form__plain-input"
              id="support-subject"
              type="text"
              name="subject"
              placeholder="Briefly describe your request"
              value={form.subject}
              onChange={updateField}
              required
            />
          </div>

          <div className="support-form__field">
            <label htmlFor="support-message">Your message *</label>
            <textarea
              id="support-message"
              name="message"
              rows="6"
              placeholder="Tell us more about how we can help..."
              value={form.message}
              onChange={updateField}
              minLength={10}
              required
            />
            <span className="support-form__hint">
              Please provide at least 10 characters.
            </span>
          </div>

          {status && (
            <div className="support-form__status" role="status">
              <AlertCircle size={17} />
              <p>{status}</p>
            </div>
          )}

          <div className="support-form__footer">
            <p>
              By submitting, you acknowledge our{" "}
              <a href="/privacy-policy">Privacy Policy</a>.
            </p>

            <button type="submit">
              Prepare request
              <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}