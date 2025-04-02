import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Detectar scroll para cambiar el estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detectar sección activa
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    
    const scrollActive = () => {
      const scrollY = window.pageYOffset;
      
      sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 100;
        const sectionId = current.getAttribute('id');
        
        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };
    
    window.addEventListener('scroll', scrollActive);
    return () => window.removeEventListener('scroll', scrollActive);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    { href: "#servicios", label: "Servicios" },
    { href: "#beneficios", label: "Beneficios" },
    { href: "#testimonios", label: "Testimonios" },
    { href: "#contacto", label: "Contacto" }
  ];

  return (
    <>
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'py-3 bg-gray-900 shadow-lg' 
          : 'py-4 bg-gray-900'
      }`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-orange-500">Jelcom</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <a 
                key={item.href} 
                href={item.href}
                className={`text-gray-300 hover:text-orange-500 transition-all ${
                  activeSection === item.href.substring(1) ? 'text-orange-500' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
            
            {/* CTA Button */}
            <a 
              href="/login" 
              className="bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-md font-medium transition-colors duration-300"
            >
              Iniciar Sesión
            </a>
          </nav>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-orange-500"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 bg-gray-900 shadow-lg z-40 md:hidden"
          >
            <div className="p-5 space-y-3">
              {menuItems.map((item) => (
                <a 
                  key={item.href} 
                  href={item.href} 
                  onClick={toggleMobileMenu}
                  className={`block py-3 px-4 rounded ${
                    activeSection === item.href.substring(1)
                      ? 'bg-gray-800 text-orange-500'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-orange-500'
                  } transition-colors`}
                >
                  {item.label}
                </a>
              ))}
              
              <div className="pt-3 border-t border-gray-800">
                <a 
                  href="/login" 
                  onClick={toggleMobileMenu}
                  className="block w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-md font-medium text-center transition-colors"
                >
                  Iniciar Sesión
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;