import os
import shutil
import sys
import certifi

print('Updating Python CA certificates using certifi...')

# Find the cacert.pem file from certifi
cacert = certifi.where()
print(f'certifi cacert.pem: {cacert}')

# Find the location of the default cacert.pem in the Python install
python_dir = os.path.dirname(sys.executable)
lib_dir = os.path.join(python_dir, 'Lib', 'site-packages')

# Try to find the requests package cacert.pem
requests_cacert = None
try:
    import requests
    requests_cacert = os.path.join(os.path.dirname(requests.__file__), 'cacert.pem')
    if os.path.exists(requests_cacert):
        print(f'Found requests cacert.pem: {requests_cacert}')
except ImportError:
    pass

# Copy certifi's cacert.pem to requests (if found)
if requests_cacert:
    shutil.copyfile(cacert, requests_cacert)
    print('Updated requests cacert.pem')

# Also try to update the system-level cacert.pem (if present)
system_cacert = os.path.join(python_dir, 'cacert.pem')
if os.path.exists(system_cacert):
    shutil.copyfile(cacert, system_cacert)
    print('Updated system cacert.pem')

print('CA certificates update complete.') 