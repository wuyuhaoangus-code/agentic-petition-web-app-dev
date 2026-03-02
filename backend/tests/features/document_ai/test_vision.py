import pytest
from unittest.mock import MagicMock, patch
import io

pytest.importorskip("google.cloud.vision")

from app.features.document_ai.vision import VisionService, TextProcessor

@pytest.fixture
def mock_vision_client():
    """Creates a fake Google Vision client."""
    return MagicMock()

@pytest.fixture
def vision_service(mock_vision_client):
    """Initializes the service with the mock client."""
    return VisionService(client=mock_vision_client)

@pytest.mark.asyncio
async def test_extract_text_stream_pdf_success(vision_service, mock_vision_client):
    # Setup
    mock_response = MagicMock()
    mock_response.full_text_annotation.text = "PDF Content"
    mock_response.error.message = ""
    mock_vision_client.document_text_detection.return_value = mock_response

    # Mock filetype detection and pdf conversion
    with patch('app.features.document_ai.vision.filetype.guess') as mock_guess, \
         patch('app.features.document_ai.vision.convert_from_bytes') as mock_convert:
        
        mock_guess.return_value.mime = "application/pdf"
        mock_convert.return_value = [MagicMock()] # One page

        dummy_pdf = b"%PDF-1.4 dummy"
        results = []
        async for page in vision_service.extract_text_stream(dummy_pdf):
            results.append(page)

    assert len(results) == 1
    assert "PDF Content" in results[0]["text"]
    mock_vision_client.document_text_detection.assert_called_once()

@pytest.mark.asyncio
async def test_extract_text_stream_image_success(vision_service, mock_vision_client):
    # Setup
    mock_response = MagicMock()
    mock_response.full_text_annotation.text = "Image Content"
    mock_response.error.message = ""
    mock_vision_client.document_text_detection.return_value = mock_response

    with patch('app.features.document_ai.vision.filetype.guess') as mock_guess:
        mock_guess.return_value.mime = "image/jpeg"

        dummy_img = b"fake-image-bytes"
        results = []
        async for page in vision_service.extract_text_stream(dummy_img):
            results.append(page)

    assert len(results) == 1
    assert "Image Content" in results[0]["text"]
    assert results[0]["total"] == 1

@pytest.mark.asyncio
async def test_extract_text_stream_docx_success(vision_service):
    with patch('app.features.document_ai.vision.filetype.guess') as mock_guess, \
         patch('app.features.document_ai.vision.docx.Document') as mock_docx:
        
        mock_guess.return_value.mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Mock docx structure
        mock_doc_obj = MagicMock()
        mock_para = MagicMock()
        mock_para.text = "Word Content"
        mock_doc_obj.paragraphs = [mock_para]
        mock_doc_obj.tables = []
        mock_docx.return_value = mock_doc_obj

        dummy_docx = b"fake-docx-bytes"
        results = []
        async for page in vision_service.extract_text_stream(dummy_docx):
            results.append(page)

    assert len(results) == 1
    assert "Word Content" in results[0]["text"]

def test_text_processor_cleaning():
    processor = TextProcessor()
    raw_input = "Name:  Angus\n·\n\n\nPage 1"
    cleaned = processor.clean(raw_input)
    assert "  " not in cleaned
    assert "·" not in cleaned
    assert "\n\n\n" not in cleaned
    assert cleaned == "Name: Angus\n\nPage 1"
