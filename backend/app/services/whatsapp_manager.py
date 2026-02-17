"""
WhatsApp Node.js sidecar process manager.

Automatically starts and stops the whatsapp-service Node.js process
alongside Flask, so there's no need to manage it separately.
"""

import subprocess
import os
import signal
import atexit
import logging
import time
import shutil

logger = logging.getLogger(__name__)

# Path to the whatsapp-service directory (relative to backend/)
# backend/app/services/whatsapp_manager.py → project root is 3 levels up
WHATSAPP_SERVICE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    'whatsapp-service'
)

_process = None


def _find_node():
    """Find node executable."""
    node = shutil.which('node')
    if node:
        return node
    # Common locations
    for path in ['/usr/bin/node', '/usr/local/bin/node', os.path.expanduser('~/.nvm/current/bin/node')]:
        if os.path.isfile(path):
            return path
    return None


def start():
    """Start the WhatsApp Node.js sidecar process."""
    global _process

    if _process and _process.poll() is None:
        logger.info('[WhatsApp] Sidecar already running (PID %d)', _process.pid)
        return True

    index_js = os.path.join(WHATSAPP_SERVICE_DIR, 'index.js')
    node_modules = os.path.join(WHATSAPP_SERVICE_DIR, 'node_modules')

    if not os.path.isfile(index_js):
        logger.warning('[WhatsApp] index.js not found at %s — sidecar non avviato', index_js)
        return False

    if not os.path.isdir(node_modules):
        logger.warning('[WhatsApp] node_modules non trovato. Esegui: cd whatsapp-service && npm install')
        return False

    node = _find_node()
    if not node:
        logger.warning('[WhatsApp] Node.js non trovato nel PATH — sidecar non avviato')
        return False

    try:
        _process = subprocess.Popen(
            [node, 'index.js'],
            cwd=WHATSAPP_SERVICE_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            preexec_fn=os.setsid  # Create new process group for clean shutdown
        )
        logger.info('[WhatsApp] Sidecar avviato (PID %d)', _process.pid)

        # Register shutdown handler
        atexit.register(stop)

        return True
    except Exception as e:
        logger.error('[WhatsApp] Errore avvio sidecar: %s', e)
        return False


def stop():
    """Stop the WhatsApp sidecar process."""
    global _process

    if _process and _process.poll() is None:
        logger.info('[WhatsApp] Stopping sidecar (PID %d)...', _process.pid)
        try:
            # Kill the entire process group (includes Chromium child processes)
            os.killpg(os.getpgid(_process.pid), signal.SIGTERM)
            _process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            logger.warning('[WhatsApp] Sidecar non risponde, force kill...')
            os.killpg(os.getpgid(_process.pid), signal.SIGKILL)
        except Exception as e:
            logger.error('[WhatsApp] Errore stop sidecar: %s', e)
        _process = None


def is_running():
    """Check if sidecar process is running."""
    return _process is not None and _process.poll() is None


def init_app(app):
    """Initialize the WhatsApp sidecar with the Flask app."""
    enabled = os.getenv('WHATSAPP_SIDECAR_ENABLED', 'true').lower() == 'true'
    if not enabled:
        logger.info('[WhatsApp] Sidecar disabilitato (WHATSAPP_SIDECAR_ENABLED=false)')
        return

    start()
