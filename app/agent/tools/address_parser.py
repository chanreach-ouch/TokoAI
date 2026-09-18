import re

def parse_address_and_phone(text: str) -> dict:
    phone_pattern = re.compile(r'(?:0|\+?855)(?:[1-9]\d{7,8})')
    phones = phone_pattern.findall(text.replace(" ", "").replace("-", ""))
    
    address = text
    for p in phones:
        address = address.replace(p, "")
    
    return {
        "phones": phones,
        "address": address.strip()
    }
