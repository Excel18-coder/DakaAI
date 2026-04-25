import { Mail, Phone, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="border-t border-border bg-background/50 backdrop-blur-sm mt-auto"
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">
              ScholarReview AI
            </h3>
            <p className="text-sm text-muted-foreground font-sans">
              AI-powered academic thesis and dissertation review tool. Get structured, comprehensive evaluations with actionable feedback.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-display font-semibold text-foreground">
              Get in Touch
            </h3>
            <div className="space-y-3">
              <a
                href="tel:+254722714313"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
              >
                <Phone className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="font-sans">+254 722 714 313</span>
              </a>

              <a
                href="mailto:davidkabata@gmail.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
              >
                <Mail className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="font-sans">davidkabata@gmail.com</span>
              </a>

              <a
                href="https://www.linkedin.com/in/dr-david-kabata-10a06114"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors group"
              >
                <Linkedin className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="font-sans">Dr. David Kabata</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center font-sans">
            © {new Date().getFullYear()} ScholarReview AI. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
