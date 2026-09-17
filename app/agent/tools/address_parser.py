import re

def parse_address_and_phone(text_input: str) -> dict:
    phone_pattern = r"(0[1-9]{2}\s?\d{3}\s?\d{3,4})"
    phones = re.findall(phone_pattern, text_input)
    
    return {
        "phones": [p.replace(" ", "") for p in phones],
        "raw_text": text_input
    }
