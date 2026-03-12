import TextRecognition from '@react-native-ml-kit/text-recognition';

export async function recognizeText(imageUri: string): Promise<string> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    return result.text || '';
  } catch {
    return '';
  }
}

// Parse insurance card OCR text for common fields
export function parseInsuranceCard(text: string): {
  member_id?: string;
  group_number?: string;
  phone?: string;
} {
  const result: { member_id?: string; group_number?: string; phone?: string } = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // Member ID patterns
  const memberIdPatterns = [
    /(?:member\s*(?:id|#|number|no))[:\s]*([A-Z0-9]{4,})/i,
    /(?:id\s*#?)[:\s]*([A-Z0-9]{6,})/i,
    /(?:subscriber\s*(?:id|#))[:\s]*([A-Z0-9]{4,})/i,
  ];
  for (const pat of memberIdPatterns) {
    const match = fullText.match(pat);
    if (match) { result.member_id = match[1]; break; }
  }

  // Group number patterns
  const groupPatterns = [
    /(?:group\s*(?:#|number|no)?)[:\s]*([A-Z0-9]{3,})/i,
    /(?:grp\s*(?:#|no)?)[:\s]*([A-Z0-9]{3,})/i,
  ];
  for (const pat of groupPatterns) {
    const match = fullText.match(pat);
    if (match) { result.group_number = match[1]; break; }
  }

  // Phone number patterns
  const phonePatterns = [
    /(?:phone|tel|call)[:\s]*([\d\-\(\)\s]{10,})/i,
    /(\(\d{3}\)\s*\d{3}[\-\s]\d{4})/,
    /(\d{3}[\-\.]\d{3}[\-\.]\d{4})/,
  ];
  for (const pat of phonePatterns) {
    const match = fullText.match(pat);
    if (match) { result.phone = match[1].trim(); break; }
  }

  return result;
}
