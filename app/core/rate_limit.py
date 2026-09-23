from slowapi import Limiter
from slowapi.util import get_remote_address

# Use a memory-based limiter for simplicity, or point it to Redis in a distributed setup
limiter = Limiter(key_func=get_remote_address)
