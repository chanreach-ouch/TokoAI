import re

REMOTE_PROVINCES = [
    "ratanakiri", "រតនគិរី", "mondulkiri", "មណ្ឌលគិរី", "preah vihear", "ព្រះវិហារ",
    "stung treng", "ស្ទឹងត្រែង", "koh kong", "កោះកុង"
]

MAJOR_PROVINCES = [
    "siem reap", "សៀមរាប", "sr", "battambang", "បាត់ដំបង", "btb", "kampot", "កំពត",
    "kandal", "កណ្តាល", "sihanoukville", "kompong som", "កំពង់សោម", "ព្រះសីហនុ", "shv",
    "kampong cham", "កំពង់ចាម", "kampong chhnang", "កំពង់ឆ្នាំង", "kampong speu", "កំពង់ស្ពឺ",
    "kampong thom", "កំពង់ធំ", "takeo", "តាកែវ", "prey veng", "ព្រៃវែង", "svay rieng", "ស្វាយរៀង",
    "pursat", "ពោធិ៍សាត់", "banteay meanchey", "បន្ទាយមានជ័យ", "poipet", "ប៉ោយប៉ែត",
    "kratie", "ក្រចេះ", "oddar meanchey", "ឧត្តរមានជ័យ", "kep", "កែប", "pailin", "ប៉ៃលិន",
    "tboung khmum", "ត្បូងឃ្មុំ"
]

PHNOM_PENH_DISTRICTS = [
    "phnom penh", "ភ្នំពេញ", "pp", "chamkarmon", "ចំការមន", "daun penh", "ដូនពេញ",
    "prampeer meakkakra", "7 makara", "៧ មករា", "toul kork", "ទួលគោក", "tk",
    "dangkao", "ដង្កោ", "mean chey", "មានជ័យ", "russey keo", "ឫស្សីកែវ",
    "sen sok", "សែនសុខ", "por senchey", "ពោធិ៍សែនជ័យ", "chroy changvar", "ជ្រោយចង្វារ",
    "prek pnov", "ព្រែកព្នៅ", "chbar ampov", "ច្បារអំពៅ", "boeng keng kang", "bkk", "បឹងកេងកង",
    "bkk1", "bkk2", "bkk3", "tuol svay prey", "toul tom poung", "tpp"
]

PHONE_REGEX = re.compile(r'(?:\+?855|0)\s*(?:[1-9]\d{1,2})[\s\-]*\d{3}[\s\-]*\d{3,4}')

def parse_address_and_phone(text: str) -> dict:
    if not text:
        return {
            "phone": None,
            "phones": [],
            "address": "",
            "destination_zone": "Phnom Penh",
            "delivery_fee_usd": 1.50,
            "delivery_fee_khr": 6150
        }
        
    # 1. Extract phone matches
    phone_matches = list(PHONE_REGEX.finditer(text))
    phones = []
    address = text
    
    for match in phone_matches:
        raw_phone = match.group(0)
        # Normalize to standard Cambodian mobile format (0XXXXXXXX)
        cleaned_phone = re.sub(r'[\s\-]', '', raw_phone)
        if cleaned_phone.startswith('+855'):
            cleaned_phone = '0' + cleaned_phone[4:]
        elif cleaned_phone.startswith('855'):
            cleaned_phone = '0' + cleaned_phone[3:]
            
        phones.append(cleaned_phone)
        address = address.replace(raw_phone, " ")
        
    address = re.sub(r'\s+', ' ', address).strip().strip(",").strip()
    primary_phone = phones[0] if phones else None

    # 2. Destination & Delivery Fee
    text_lower = text.lower()
    
    is_remote = any(prov in text_lower for prov in REMOTE_PROVINCES)
    is_major_prov = any(prov in text_lower for prov in MAJOR_PROVINCES)
    is_phnom_penh = any(district in text_lower for district in PHNOM_PENH_DISTRICTS)
    
    if is_remote and not is_phnom_penh:
        destination_zone = "Remote Province"
        delivery_fee_usd = 3.00
    elif is_major_prov and not is_phnom_penh:
        destination_zone = "Major Province"
        delivery_fee_usd = 2.50
    else:
        destination_zone = "Phnom Penh"
        delivery_fee_usd = 1.50

    return {
        "phone": primary_phone,
        "phones": phones,
        "address": address,
        "destination_zone": destination_zone,
        "delivery_fee_usd": delivery_fee_usd,
        "delivery_fee_khr": int(delivery_fee_usd * 4100)
    }
