import  { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Layout/Navbar';
// import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';

function App() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-in-sine', once: true });
  }, []);

  return (
    <LanguageProvider>
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white transition-all min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <HomePage />
        </main>
        {/* <Footer /> */}
      </div>
    </LanguageProvider>
  );
}

export default App;