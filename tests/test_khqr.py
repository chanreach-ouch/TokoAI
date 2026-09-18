from app.agent.tools.khqr_generator import generate_khqr_payload
from crccheck.crc import Crc16CcittFalse

def test_khqr_generation_and_checksum():
    payload_with_crc = generate_khqr_payload(14.00)
    
    assert len(payload_with_crc) > 4
    
    payload_no_crc = payload_with_crc[:-4]
    checksum = payload_with_crc[-4:]
    
    expected_crc = Crc16CcittFalse.calc(payload_no_crc.encode('utf-8'))
    expected_checksum = f"{expected_crc:04X}"
    
    assert checksum == expected_checksum
    
    assert payload_with_crc.startswith("000201")
    assert "540514.00" in payload_with_crc
