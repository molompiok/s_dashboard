// Components/PageHelper/PageHelper.tsx

import { useState, useEffect } from 'react';
import { useIsFetching } from '@tanstack/react-query'; // Hook pour détecter chargement global
import { IoArrowUp } from "react-icons/io5";
import { AnimatePresence, motion } from 'framer-motion'; // Pour animations apparition/disparition
import { getImg } from '../Utils/StringFormater'; // Pour l'URL du GIF
import { debounce } from '../Utils/functions';

export function PageHelper() {
    // --- Détection du Scroll ---
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        // Afficher le bouton si on a scrollé d'une certaine hauteur (ex: 300px)
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth', // Scroll fluide
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        // Vérifier état initial au cas où la page charge déjà scrollée
        toggleVisibility();
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    // --- Détection du Chargement Global ---
    const isFetching = useIsFetching(); // Retourne le nombre de queries en cours de fetch
    const [ showLoader, setShowLoader ] = useState(false)
    useEffect(()=>{
        debounce(()=>{
            setShowLoader(isFetching > 0)
        },'page-helper',1000)
    },[isFetching]);
    
    // --- Visibilité du Conteneur Global ---
    // Le conteneur est visible si on a scrollé OU si une requête charge
    const showContainer = isVisible || showLoader;

    return (
        <AnimatePresence>
            {showContainer && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    // Position fixe en bas à droite
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
                >
                    {/* Indicateur de Chargement (visible si showLoader est true) */}
                     <AnimatePresence>
                        {showLoader && (
                             <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="p-1.5 bg-black/50 rounded-full shadow-lg backdrop-blur-sm"
                             >
                                <img
                                    src={getImg('/res/loading_white.gif').match(/url\("?([^"]+)"?\)/)?.[1]} // Utiliser le GIF blanc
                                    alt="Loading..."
                                    className="w-6 h-6"
                                />
                            </motion.div>
                        )}
                     </AnimatePresence>

                    {/* Bouton Scroll-to-Top (visible si isVisible est true) */}
                     <AnimatePresence>
                        {isVisible && (
                             <motion.button
                                 initial={{ opacity: 0, scale: 0.5 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.5 }}
                                 onClick={scrollToTop}
                                 className="p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                                 aria-label="Remonter en haut" // Accessibilité
                             >
                                <IoArrowUp className="w-5 h-5" />
                            </motion.button>
                        )}
                     </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}