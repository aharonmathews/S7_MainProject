from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import dateparser

class DateExtractor:
    """Extract dates and times from message text"""
    
    # Common date patterns
    DATE_PATTERNS = [
        # DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
        r'\b(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})\b',
        # YYYY-MM-DD
        r'\b(\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})\b',
        # Month DD, YYYY or DD Month YYYY
        r'\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b',
        r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b',
        # Natural language dates
        r'\b(today|tomorrow|yesterday|next week|next month)\b',
        r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
    ]
    
    # Time patterns
    TIME_PATTERNS = [
        # HH:MM AM/PM, HH:MM:SS AM/PM
        r'\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b',
        # HH:MM (24-hour)
        r'\b(\d{1,2}:\d{2}(?::\d{2})?)\b',
        # Natural language times
        r'\b(morning|afternoon|evening|night|noon|midnight)\b',
    ]
    
    def extract_dates_and_times(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract all dates and times from text
        Returns list of dicts with date/time info and position in text
        """
        if not text:
            return []
        
        results = []
        seen_texts = set()  # Avoid duplicates
        
        # Extract dates
        for pattern in self.DATE_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                date_text = match.group(1)
                if date_text.lower() in seen_texts:
                    continue
                
                seen_texts.add(date_text.lower())
                
                # Parse the date
                parsed_date = dateparser.parse(
                    date_text,
                    settings={
                        'PREFER_DATES_FROM': 'future',
                        'RETURN_AS_TIMEZONE_AWARE': False
                    }
                )
                
                if parsed_date:
                    results.append({
                        'type': 'date',
                        'text': date_text,
                        'parsed': parsed_date.strftime('%Y-%m-%d'),
                        'display': parsed_date.strftime('%B %d, %Y'),
                        'start_pos': match.start(1),
                        'end_pos': match.end(1)
                    })
        
        # Extract times
        for pattern in self.TIME_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                time_text = match.group(1)
                if time_text.lower() in seen_texts:
                    continue
                
                seen_texts.add(time_text.lower())
                
                # Parse time (combine with today's date for parsing)
                parsed_time = dateparser.parse(
                    time_text,
                    settings={'RETURN_AS_TIMEZONE_AWARE': False}
                )
                
                if parsed_time:
                    results.append({
                        'type': 'time',
                        'text': time_text,
                        'parsed': parsed_time.strftime('%H:%M'),
                        'display': parsed_time.strftime('%I:%M %p'),
                        'start_pos': match.start(1),
                        'end_pos': match.end(1)
                    })
        
        # Sort by position in text
        results.sort(key=lambda x: x['start_pos'])
        
        return results
    
    def extract_context(self, text: str, start_pos: int, end_pos: int, context_size: int = 50) -> str:
        """Extract surrounding context for a date/time mention"""
        context_start = max(0, start_pos - context_size)
        context_end = min(len(text), end_pos + context_size)
        context = text[context_start:context_end].strip()
        return context

date_extractor = DateExtractor()