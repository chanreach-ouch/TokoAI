import re

CAMBODIAN_PROVINCES = [
    "siem reap", "សៀមរាប", "battambang", "បាត់ដំបង", "kampot", "កំពត",
    "kandal", "កណ្តាល", "sihanoukville", "kompong som", "កំពង់សោម", "ព្រះសីហនុ",
    "kampong cham", "កំពង់ចាម", "kampong chhnang", "កំពង់ឆ្នាំង", "kampong speu", "កំពង់ស្ពឺ",
    "kampong thom", "កំពង់ធំ", "takeo", "តាកែវ", "prey veng", "ព្រៃវែង", "svay rieng", "ស្វាយរៀង",
    "pursat", "ពោធិ៍សាត់", "banteay meanchey", "បន្ទាយមានជ័យ", "poipet", "ប៉ោយប៉ែត",
    "koh kong", "កោះកុង", "kratie", "ក្រចេះ", "stung treng", "ស្ទឹងត្រែង", "ratanakiri", "រតនគិរី",
    "mondulkiri", "មណ្ឌលគិរី", "preah vihear", "ព្រះវិហារ", "oddar meanchey", "ឧត្តរមានជ័យ",
    "kep", "កែប", "pailin", "ប៉ៃលិន", "tboung khmum", "ត្បូងឃ្មុំ"
]

PHNOM_PENH_DISTRICTS = [
    "phnom penh", "ភ្នំពេញ", "pp", "chamkarmon", "ចំការមន", "daun penh", "ដូនពេញ",
    "prampeer meakkakra", "7 makara", "៧ មករា", "toul kork", "ទួលគោក",
    "dangkao", "ដង្កោ", "mean chey", "មានជ័យ", "russey keo", "ឫស្សីកែវ",
    "sen sok", "សែនសុខ", "por senchey", "ពោធិ៍សែនជ័យ", "chroy changvar", "ជ្រោយចង្វារ",
    "prek pnov", "ព្រែកព្នៅ", "chbar ampov", "ច្បារអំពៅ", "boeng keng kang", "bkk", "បឹងកេងកង",
    "bkk1", "bkk2", "bkk3", "tuol svay prey", "toul tom poung"
]

def parse_address_and_phone(text: str) -> dict:
    cleaned = text.replace(" ", "").replace("-", "")
    phone_pattern = re.compile(r'(?:0|\+?855)(?:[1-9]\d{7,8})')
    phones = phone_pattern.findall(cleaned)
    
    address = text
    for p in phones:
        address = address.replace(p, "")
    address = address.strip()

    text_lower = text.lower()
    
    is_province = any(prov in text_lower for prov in CAMBODIAN_PROVINCES)
    is_phnom_penh = any(district in text_lower for district in PHNOM_PENH_DISTRICTS)
    
    if is_province and not is_phnom_penh:
        destination_zone = "Province"
        delivery_fee_usd = 2.50
    else:
        destination_zone = "Phnom Penh"
        delivery_fee_usd = 1.50

    return {
        "phones": phones,
        "address": address,
        "destination_zone": destination_zone,
        "delivery_fee_usd": delivery_fee_usd,
        "delivery_fee_khr": int(delivery_fee_usd * 4100)
    }
