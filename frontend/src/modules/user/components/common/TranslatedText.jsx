import React from 'react';
import { useGoogleTranslation } from '../../../../hooks/useGoogleTranslation';

const TranslatedText = ({ text, className = '' }) => {
    const translated = useGoogleTranslation(text);
    return <span className={className}>{translated}</span>;
};

export default TranslatedText;
