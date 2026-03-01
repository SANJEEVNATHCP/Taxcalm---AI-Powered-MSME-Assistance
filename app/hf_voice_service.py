"""
Hugging Face Voice AI Service
Provides enhanced voice capabilities using Hugging Face Inference API
- Speech-to-Text (STT) using OpenAI Whisper
- Text-to-Speech (TTS) using Microsoft SpeechT5
- Intent Classification using BART zero-shot
"""

import os
import base64
import io
import logging
from typing import Optional, Dict, Any, List
from huggingface_hub import InferenceClient
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("⚠️ pydub not available - audio format conversion disabled (install ffmpeg + pydub for full support)")
import httpx

logger = logging.getLogger(__name__)

class HuggingFaceVoiceService:
    """Hugging Face Voice AI Service using Inference API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Hugging Face Voice Service
        
        Args:
            api_key: Hugging Face API token (reads from env if not provided)
        """
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        
        if not self.api_key:
            logger.warning("⚠️ HUGGINGFACE_API_KEY not set - HF features will be disabled")
            self.enabled = False
            return
        
        self.enabled = True
        self.client = InferenceClient(token=self.api_key)
        
        # Model configurations
        self.stt_model = os.getenv("HF_STT_MODEL", "openai/whisper-base")
        self.tts_model = os.getenv("HF_TTS_MODEL", "microsoft/speecht5_tts")
        self.intent_model = os.getenv("HF_INTENT_MODEL", "facebook/bart-large-mnli")
        
        logger.info(f"✅ HuggingFace Voice Service initialized")
        logger.info(f"   STT Model: {self.stt_model}")
        logger.info(f"   TTS Model: {self.tts_model}")
        logger.info(f"   Intent Model: {self.intent_model}")
    
    async def transcribe_audio(
        self, 
        audio_data: bytes,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text using Whisper model
        
        Args:
            audio_data: Audio file bytes (WAV, MP3, OGG, etc.)
            language: Language code (default: "en" for English)
        
        Returns:
            dict: {"text": str, "confidence": float, "language": str}
        """
        if not self.enabled:
            raise ValueError("HuggingFace service not enabled - API key missing")
        
        try:
            logger.info(f"🎤 Transcribing audio ({len(audio_data)} bytes) with Whisper...")
            
            # Use Hugging Face Inference API for automatic speech recognition
            result = self.client.automatic_speech_recognition(
                audio_data,
                model=self.stt_model
            )
            
            transcribed_text = result.get("text", "")
            
            logger.info(f"✅ Transcription complete: '{transcribed_text}'")
            
            return {
                "text": transcribed_text,
                "confidence": 1.0,  # Whisper doesn't provide confidence scores
                "language": language,
                "model": self.stt_model,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"❌ Transcription error: {str(e)}")
            return {
                "text": "",
                "confidence": 0.0,
                "language": language,
                "model": self.stt_model,
                "success": False,
                "error": str(e)
            }
    
    async def synthesize_speech(
        self,
        text: str,
        voice: str = "default",
        speed: float = 1.0
    ) -> Dict[str, Any]:
        """
        Convert text to speech using TTS model
        
        Args:
            text: Text to synthesize
            voice: Voice style (default, professional, friendly)
            speed: Speech speed multiplier (0.5 to 2.0)
        
        Returns:
            dict: {"audio_base64": str, "format": str, "duration": float}
        """
        if not self.enabled:
            raise ValueError("HuggingFace service not enabled - API key missing")
        
        try:
            logger.info(f"🔊 Synthesizing speech: '{text[:50]}...'")
            
            # Use Hugging Face Inference API for text-to-speech
            audio_bytes = self.client.text_to_speech(
                text,
                model=self.tts_model
            )
            
            # Convert to base64 for JSON response
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            logger.info(f"✅ Speech synthesis complete ({len(audio_bytes)} bytes)")
            
            return {
                "audio_base64": audio_base64,
                "format": "audio/flac",  # SpeechT5 outputs FLAC
                "text": text,
                "model": self.tts_model,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"❌ TTS error: {str(e)}")
            return {
                "audio_base64": "",
                "format": "",
                "text": text,
                "model": self.tts_model,
                "success": False,
                "error": str(e)
            }
    
    async def classify_intent(
        self,
        text: str,
        candidate_labels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Classify user intent using zero-shot classification
        
        Args:
            text: User's input text
            candidate_labels: List of possible intents (uses defaults if None)
        
        Returns:
            dict: {"intent": str, "confidence": float, "all_scores": dict}
        """
        if not self.enabled:
            raise ValueError("HuggingFace service not enabled - API key missing")
        
        # Default intent categories for TaxCalm
        if candidate_labels is None:
            candidate_labels = [
                "navigate to page",
                "calculate GST or tax",
                "create financial transaction",
                "general question about tax",
                "compliance and filing",
                "government schemes",
                "generate report"
            ]
        
        try:
            logger.info(f"🤖 Classifying intent: '{text[:50]}...'")
            
            # Use Hugging Face Inference API for zero-shot classification
            result = self.client.zero_shot_classification(
                text,
                labels=candidate_labels,
                model=self.intent_model
            )
            
            # Extract results
            top_intent = result["labels"][0]
            top_score = result["scores"][0]
            all_scores = dict(zip(result["labels"], result["scores"]))
            
            logger.info(f"✅ Intent classified: '{top_intent}' (confidence: {top_score:.2f})")
            
            return {
                "intent": top_intent,
                "confidence": top_score,
                "all_scores": all_scores,
                "text": text,
                "model": self.intent_model,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"❌ Intent classification error: {str(e)}")
            return {
                "intent": "general question about tax",  # Default fallback
                "confidence": 0.0,
                "all_scores": {},
                "text": text,
                "model": self.intent_model,
                "success": False,
                "error": str(e)
            }
    
    async def convert_audio_format(
        self,
        audio_data: bytes,
        from_format: str = "webm",
        to_format: str = "wav",
        sample_rate: int = 16000
    ) -> bytes:
        """
        Convert audio format for better compatibility with Whisper
        
        Args:
            audio_data: Input audio bytes
            from_format: Source format (webm, ogg, mp3, etc.)
            to_format: Target format (wav recommended for Whisper)
            sample_rate: Target sample rate in Hz (16000 for Whisper)
        
        Returns:
            bytes: Converted audio data
        """
        if not PYDUB_AVAILABLE:
            logger.warning("⚠️ pydub not available - returning original audio (may reduce Whisper accuracy)")
            return audio_data
        
        try:
            logger.info(f"🔄 Converting audio: {from_format} → {to_format} @ {sample_rate}Hz")
            
            # Load audio with pydub
            audio = AudioSegment.from_file(
                io.BytesIO(audio_data),
                format=from_format
            )
            
            # Convert to mono (single channel)
            if audio.channels > 1:
                audio = audio.set_channels(1)
            
            # Set sample rate
            audio = audio.set_frame_rate(sample_rate)
            
            # Export to target format
            output_buffer = io.BytesIO()
            audio.export(output_buffer, format=to_format)
            output_buffer.seek(0)
            
            converted_data = output_buffer.read()
            logger.info(f"✅ Audio converted: {len(audio_data)} → {len(converted_data)} bytes")
            
            return converted_data
            
        except Exception as e:
            logger.error(f"❌ Audio conversion error: {str(e)}")
            # Return original data if conversion fails
            return audio_data
    
    def is_available(self) -> bool:
        """Check if HuggingFace service is available"""
        return self.enabled
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check health of HuggingFace service
        
        Returns:
            dict: {"status": str, "stt": bool, "tts": bool, "intent": bool}
        """
        if not self.enabled:
            return {
                "status": "disabled",
                "message": "HUGGINGFACE_API_KEY not configured",
                "stt": False,
                "tts": False,
                "intent": False
            }
        
        health = {
            "status": "healthy",
            "message": "HuggingFace Voice Service operational",
            "stt": True,
            "tts": True,
            "intent": True,
            "models": {
                "stt": self.stt_model,
                "tts": self.tts_model,
                "intent": self.intent_model
            }
        }
        
        return health


# Singleton instance
_hf_service_instance: Optional[HuggingFaceVoiceService] = None

def get_hf_voice_service() -> HuggingFaceVoiceService:
    """Get or create HuggingFace Voice Service singleton"""
    global _hf_service_instance
    
    if _hf_service_instance is None:
        _hf_service_instance = HuggingFaceVoiceService()
    
    return _hf_service_instance
