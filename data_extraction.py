import os
import uuid
import logging
from datetime import datetime
from typing import Dict, Any

from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from PIL import Image
import pytesseract

load_dotenv()

logger = logging.getLogger(__name__)

class TaskExtractor:

    @staticmethod
    def _generate_task(content: str, source_type: str, source_name: str, extracted_by: str) -> Dict[str, Any]:
        """Create a standardized task dictionary."""
        return {
            "source_type": source_type,
            "source_name": source_name,
            "content": content.strip(),
            "timestamp": datetime.now().isoformat(),
            "extracted_by": extracted_by,
            "status": "uploaded",
            "analysis": None,
            "execution_plan": None,
            "progress": None,
            "emergency_mode": None
        }

    @staticmethod
    def extract_pdf(pdf_path: str) -> Dict[str, Any]:
        """Extract text from a PDF."""
        logger.info(f"Extracting text from PDF: {pdf_path}")
        try:
            loader = PyMuPDFLoader(pdf_path)
            docs = loader.load()
            content = "\n".join(doc.page_content for doc in docs).strip()
            
            if not content:
                raise ValueError("PDF extraction resulted in empty text. The file might be scanned or empty.")
                
            return TaskExtractor._generate_task(
                content=content,
                source_type="pdf",
                source_name=os.path.basename(pdf_path),
                extracted_by="pdf_retriever"
            )
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise RuntimeError(f"Could not read PDF '{os.path.basename(pdf_path)}': {e}") from e

    @staticmethod
    def extract_image(image_path: str) -> Dict[str, Any]:
        """Extract text from an image using OCR."""
        logger.info(f"Extracting text from image using OCR: {image_path}")
        try:
            image = Image.open(image_path)
            content = pytesseract.image_to_string(image).strip()
            
            if not content:
                raise ValueError("OCR extraction resulted in empty text. The image might not contain readable text.")
                
            return TaskExtractor._generate_task(
                content=content,
                source_type="image",
                source_name=os.path.basename(image_path),
                extracted_by="image_retriever"
            )
        except Exception as e:
            logger.error(f"Failed to extract text from image: {e}")
            raise RuntimeError(f"Could not process image '{os.path.basename(image_path)}': {e}") from e

    @staticmethod
    def extract_text(text: str) -> Dict[str, Any]:
        """Handle manually entered text."""
        logger.info("Extracting raw text input.")
        text = text.strip()
        if not text:
            raise ValueError("Input text is empty.")
            
        return TaskExtractor._generate_task(
            content=text,
            source_type="text",
            source_name="manual_input",
            extracted_by="text_retriever"
        )

    @staticmethod
    def extract(input_data: str) -> Dict[str, Any]:
        """
        Automatically determine the input type and
        return a standardized task dictionary.
        """
        if not input_data or not isinstance(input_data, str) or not input_data.strip():
            raise ValueError("Input cannot be empty.")

        input_data = input_data.strip()

        if os.path.isfile(input_data):
            extension = os.path.splitext(input_data)[1].lower()
            if extension == ".pdf":
                return TaskExtractor.extract_pdf(input_data)
            elif extension in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
                return TaskExtractor.extract_image(input_data)
            else:
                raise ValueError(f"Unsupported file type: {extension}")

        return TaskExtractor.extract_text(input_data)
