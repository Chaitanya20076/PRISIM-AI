import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  X,
} from "lucide-react";
import "./faq-content.css";

const faqCategories = [
  {
    id: "general",
    name: "General",
    number: "01",
    description: "Get to know PRISM AI and what we're all about.",
    questions: [
      {
        question: "What is PRISM AI?",
        answer:
          "PRISM AI is an artificial intelligence-focused student community at RNS Institute of Technology. It brings together curious minds who want to explore AI, build innovative solutions, collaborate on projects and learn through practical experiences.",
      },
      {
        question: "What does PRISM AI stand for?",
        answer:
          "PRISM AI represents a community built around curiosity, innovation and the possibilities of artificial intelligence. Our guiding tagline is 'Explore. Innovate. Impact.'",
      },
      {
        question: "Where is PRISM AI based?",
        answer:
          "PRISM AI is associated with RNS Institute of Technology (RNSIT), Bengaluru.",
      },
      {
        question: "Who can be part of PRISM AI?",
        answer:
          "Students interested in artificial intelligence, machine learning, technology, research and innovation can explore opportunities to participate. Specific eligibility requirements may depend on the activity or recruitment drive.",
      },
    ],
  },
  {
    id: "membership",
    name: "Membership",
    number: "02",
    description: "Everything about joining our community.",
    questions: [
      {
        question: "How can I join PRISM AI?",
        answer:
          "Keep an eye on our official announcements and recruitment updates. When recruitment is open, follow the instructions published on the website or official club channels.",
      },
      {
        question: "Do I need prior AI or programming experience?",
        answer:
          "Not necessarily. A willingness to learn, curiosity and genuine interest in technology are valuable starting points. Some specialised roles or activities may require relevant skills.",
      },
      {
        question: "Is there a membership fee?",
        answer:
          "Membership fee details, if applicable, will be communicated through official club announcements. Please check with the PRISM AI team for the latest information.",
      },
      {
        question: "Can students from different branches participate?",
        answer:
          "Opportunities may be open to students from different academic backgrounds, depending on the activity and its eligibility requirements. Check the relevant announcement for details.",
      },
    ],
  },
  {
    id: "workshops",
    name: "Workshops",
    number: "03",
    description: "Learn, experiment and build new skills.",
    questions: [
      {
        question: "Does PRISM AI conduct workshops?",
        answer:
          "Yes. PRISM AI aims to organise learning experiences and workshops around AI-related concepts, tools, technologies and practical applications.",
      },
      {
        question: "Are workshops beginner-friendly?",
        answer:
          "Workshop difficulty depends on the topic. Some sessions may introduce foundational concepts, while others may be designed for participants with prior knowledge. The event announcement will mention any prerequisites.",
      },
      {
        question: "How do I register for a workshop?",
        answer:
          "Registration instructions will be shared on the respective event page or official announcement. Follow the provided registration link and complete the required steps.",
      },
      {
        question: "Will I receive a certificate?",
        answer:
          "Certificate availability depends on the specific workshop and its organisers. Refer to the event announcement for confirmation.",
      },
    ],
  },
  {
    id: "hackathons",
    name: "Hackathons & Events",
    number: "04",
    description: "Participate, collaborate and showcase your ideas.",
    questions: [
      {
        question: "Does PRISM AI organise hackathons?",
        answer:
          "PRISM AI aims to create opportunities for students to participate in innovation-driven activities, challenges and hackathons. Updates will be announced through official channels.",
      },
      {
        question: "Can beginners participate in hackathons?",
        answer:
          "That depends on the specific hackathon. Some events welcome beginners, while others may have technical prerequisites. Check the eligibility and participation guidelines before registering.",
      },
      {
        question: "Can I participate as an individual?",
        answer:
          "Individual and team participation rules vary by event. The respective event announcement will specify team-size requirements and participation formats.",
      },
      {
        question: "Where can I find upcoming events?",
        answer:
          "Visit the Events section of the PRISM AI website and follow our official communication channels for upcoming events, registration details and announcements.",
      },
    ],
  },
  {
    id: "projects",
    name: "Projects & Research",
    number: "05",
    description: "Turn ideas into meaningful technical work.",
    questions: [
      {
        question: "Can I work on projects through PRISM AI?",
        answer:
          "PRISM AI encourages collaborative learning and practical project development. Opportunities to participate in projects may be announced by the club or its project teams.",
      },
      {
        question: "Do I need to have a project idea before joining?",
        answer:
          "No. You can begin by learning, exploring existing initiatives and collaborating with other members. You can also bring forward ideas when project opportunities arise.",
      },
      {
        question: "Does PRISM AI support research activities?",
        answer:
          "Research and exploration are among the areas PRISM AI aims to encourage. Specific research opportunities and collaborations depend on ongoing initiatives and faculty or mentor involvement.",
      },
      {
        question: "Can I showcase my project on the website?",
        answer:
          "Project showcase opportunities may be provided through the Projects section. Publication details and eligibility can be confirmed with the PRISM AI team.",
      },
    ],
  },
  {
    id: "mentorship",
    name: "Mentorship & Learning",
    number: "06",
    description: "Get guidance as you grow your skills.",
    questions: [
      {
        question: "Does PRISM AI provide mentorship?",
        answer:
          "PRISM AI aims to encourage peer learning, knowledge sharing and guidance through its community and learning initiatives. Availability depends on the programme and mentors involved.",
      },
      {
        question: "What should I learn to get started with AI?",
        answer:
          "A foundation in programming, mathematics and problem-solving can be helpful. You can gradually explore areas such as machine learning, deep learning, generative AI and data science based on your interests.",
      },
      {
        question: "Can experienced students help beginners?",
        answer:
          "Peer learning and collaboration are encouraged. Members can share knowledge, discuss ideas and support one another through appropriate club initiatives.",
      },
    ],
  },
  {
    id: "website",
    name: "Website & Accounts",
    number: "07",
    description: "Help with using the PRISM AI website.",
    questions: [
      {
        question: "How do I stay updated with PRISM AI?",
        answer:
          "Check the website regularly and follow the official PRISM AI communication and social media channels for announcements, event updates and opportunities.",
      },
      {
        question: "Do I need an account to browse the website?",
        answer:
          "Public information pages can generally be explored without an account. Some features or activities may require registration or authentication.",
      },
      {
        question: "What if I find an error on the website?",
        answer:
          "Please report the issue through the Support or Contact section. Include a short description of the problem and, if possible, the page where it occurred.",
      },
      {
        question: "How is my information handled?",
        answer:
          "Please refer to the PRISM AI Privacy Policy for information about how personal information submitted through the website may be collected and used.",
      },
    ],
  },
  {
    id: "contact",
    name: "Contact & Support",
    number: "08",
    description: "We're here if you need further assistance.",
    questions: [
      {
        question: "How can I contact the PRISM AI team?",
        answer:
          "Use the Support or Contact section of the website, or reach out through the official communication channels listed by PRISM AI.",
      },
      {
        question: "Can I collaborate with PRISM AI?",
        answer:
          "We welcome interest in meaningful collaborations. Share your proposal and relevant details through the official contact channels so the team can review your request.",
      },
      {
        question: "Where can I share suggestions or feedback?",
        answer:
          "You can send your suggestions through the Support or Contact section. Constructive feedback helps us improve our community and website experience.",
      },
    ],
  },
];

export default function FAQContent() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null);

  const activeData = faqCategories.find(
    (category) => category.id === activeCategory
  );

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return faqCategories.filter(
        (category) => category.id === activeCategory
      );
    }

    return faqCategories
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [search, activeCategory]);

  const handleCategoryChange = (id) => {
    setActiveCategory(id);
    setSearch("");
    setOpenQuestion(null);
  };

  const toggleQuestion = (key) => {
    setOpenQuestion((current) => (current === key ? null : key));
  };

  return (
    <section className="faq-content" id="faq-content">
      <div className="faq-content__top">
        <div className="faq-content__heading">
          <span className="faq-content__eyebrow">
            FIND WHAT YOU'RE LOOKING FOR
          </span>

          <h2>
            Let's clear
            <br />
            <span>things up.</span>
          </h2>

          <p>
            Browse by topic or search for a specific question.
            We've put together answers to help you get started.
          </p>
        </div>

        <div className="faq-content__search-wrap">
          <Search size={19} />
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpenQuestion(null);
            }}
            placeholder="Search your question..."
            aria-label="Search frequently asked questions"
          />

          {search && (
            <button
              className="faq-content__clear"
              onClick={() => {
                setSearch("");
                setOpenQuestion(null);
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="faq-content__layout">
        <aside className="faq-content__categories">
          <span className="faq-content__category-label">BROWSE TOPICS</span>

          {faqCategories.map((category) => (
            <button
              key={category.id}
              className={`faq-content__category ${
                activeCategory === category.id && !search ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <span className="faq-content__category-number">
                {category.number}
              </span>

              <span>{category.name}</span>

              <span className="faq-content__category-arrow">
                <ArrowUpRight size={14} />
              </span>
            </button>
          ))}

          <div className="faq-content__category-note">
            <Sparkles size={16} />
            <p>
              Can't find your answer? We're always happy to help.
            </p>
          </div>
        </aside>

        <div className="faq-content__questions">
          {search ? (
            <>
              <div className="faq-content__results-heading">
                <div>
                  <span className="faq-content__eyebrow">SEARCH RESULTS</span>
                  <h3>Matching questions</h3>
                </div>
                <span className="faq-content__result-count">
                  {filteredCategories.reduce(
                    (total, category) => total + category.questions.length,
                    0
                  )}{" "}
                  results
                </span>
              </div>

              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div key={category.id} className="faq-content__result-group">
                    <span className="faq-content__group-label">
                      {category.name}
                    </span>

                    {category.questions.map((item, index) => {
                      const key = `${category.id}-${index}`;
                      const isOpen = openQuestion === key;

                      return (
                        <FAQItem
                          key={key}
                          item={item}
                          isOpen={isOpen}
                          onClick={() => toggleQuestion(key)}
                        />
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="faq-content__empty">
                  <Search size={25} />
                  <h3>No matching questions found</h3>
                  <p>
                    Try a different keyword or browse the topics on the left.
                  </p>
                  <button onClick={() => setSearch("")}>
                    Clear search
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="faq-content__results-heading">
                <div>
                  <span className="faq-content__eyebrow">
                    {activeData?.number} / 08
                  </span>
                  <h3>{activeData?.name}</h3>
                  <p>{activeData?.description}</p>
                </div>

                <span className="faq-content__result-count">
                  {activeData?.questions.length} questions
                </span>
              </div>

              <div className="faq-content__accordion">
                {activeData?.questions.map((item, index) => {
                  const key = `${activeCategory}-${index}`;
                  const isOpen = openQuestion === key;

                  return (
                    <FAQItem
                      key={key}
                      item={item}
                      isOpen={isOpen}
                      onClick={() => toggleQuestion(key)}
                    />
                  );
                })}
              </div>

              <div className="faq-content__category-pagination">
                <span>
                  TOPIC {activeData?.number} OF 08
                </span>

                <div>
                  <button
                    disabled={activeCategory === faqCategories[0].id}
                    onClick={() => {
                      const index = faqCategories.findIndex(
                        (item) => item.id === activeCategory
                      );
                      handleCategoryChange(faqCategories[index - 1].id);
                    }}
                  >
                    Previous
                  </button>

                  <button
                    disabled={
                      activeCategory ===
                      faqCategories[faqCategories.length - 1].id
                    }
                    onClick={() => {
                      const index = faqCategories.findIndex(
                        (item) => item.id === activeCategory
                      );
                      handleCategoryChange(faqCategories[index + 1].id);
                    }}
                  >
                    Next <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ item, isOpen, onClick }) {
  return (
    <article className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
      <button
        className="faq-item__question"
        onClick={onClick}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>

        <span className="faq-item__icon">
          <ChevronDown size={17} />
        </span>
      </button>

      <div className="faq-item__answer-wrap">
        <div className="faq-item__answer">
          <p>{item.answer}</p>
        </div>
      </div>
    </article>
  );
}