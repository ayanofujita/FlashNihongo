import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-6 flex-shrink-0 md:block hidden">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="text-xs text-gray-500 mb-2 sm:mb-0">
          © {new Date().getFullYear()} NihongoFlash
        </div>
        <div className="flex space-x-4 text-xs">
          <Link href="/help">
            <a className="text-gray-500 hover:text-gray-700">Help</a>
          </Link>
          <Link href="/privacy">
            <a className="text-gray-500 hover:text-gray-700">Privacy</a>
          </Link>
          <Link href="/terms">
            <a className="text-gray-500 hover:text-gray-700">Terms</a>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
