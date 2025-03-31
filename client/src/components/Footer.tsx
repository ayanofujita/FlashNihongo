import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} NihongoFlash - Japanese Learning Flashcards
          </div>
          <div className="flex space-x-6">
            <Link href="/help">
              <a className="text-gray-500 hover:text-gray-700">Help</a>
            </Link>
            <Link href="/privacy">
              <a className="text-gray-500 hover:text-gray-700">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="text-gray-500 hover:text-gray-700">Terms</a>
            </Link>
            <Link href="/contact">
              <a className="text-gray-500 hover:text-gray-700">Contact</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
