"""
Google Translator Integration - Server-side translation
Uses deep-translator library for reliable translation without API keys
"""

from deep_translator import GoogleTranslator
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Supported languages
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'bn': 'Bengali',
    'or': 'Odia',
    'as': 'Assamese'
}


@lru_cache(maxsize=1000)
def translate_text(text: str, target_lang: str, source_lang: str = 'en') -> str:
    """
    Translate text from source language to target language
    
    Args:
        text: Text to translate
        target_lang: Target language code (e.g., 'hi', 'ta')
        source_lang: Source language code (default: 'en')
    
    Returns:
        Translated text
    """
    try:
        # Skip translation if source and target are the same
        if source_lang == target_lang:
            return text
        
        # Skip translation for English target
        if target_lang == 'en':
            return text
        
        # Validate language codes
        if target_lang not in SUPPORTED_LANGUAGES:
            logger.warning(f"Unsupported target language: {target_lang}")
            return text
        
        # Translate using Google Translator
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        
        logger.info(f"Translated from {source_lang} to {target_lang}: {text[:50]}...")
        return translated
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text  # Return original text on error


def translate_batch(texts: list, target_lang: str, source_lang: str = 'en') -> list:
    """
    Translate multiple texts at once
    
    Args:
        texts: List of texts to translate
        target_lang: Target language code
        source_lang: Source language code (default: 'en')
    
    Returns:
        List of translated texts
    """
    try:
        return [translate_text(text, target_lang, source_lang) for text in texts]
    except Exception as e:
        logger.error(f"Batch translation error: {str(e)}")
        return texts


def get_supported_languages() -> dict:
    """Get dictionary of supported languages"""
    return SUPPORTED_LANGUAGES


def is_language_supported(lang_code: str) -> bool:
    """Check if a language code is supported"""
    return lang_code in SUPPORTED_LANGUAGES
