# Makefile for CyberPot Attack Map

PYTHON = python3
PIP = $(PYTHON) -m pip

.PHONY: help install run-map run-data update-hashes check-hashes lint test clean

help:
	@echo "Usage:"
	@echo "  make install         Install dependencies"
	@echo "  make run-map         Start the Attack Map Server (Websocket/Static)"
	@echo "  make run-data        Start the Data Server (ES to Redis)"
	@echo "  make update-hashes   Update integrity hashes in index.html"
	@echo "  make check-hashes    Check integrity hashes without updating"
	@echo "  make lint            Run flake8 for code linting"
	@echo "  make test            Run tests"
	@echo "  make clean           Clean up temporary files"

install:
	$(PIP) install -r requirements.txt

run-map:
	$(PYTHON) AttackMapServer.py

run-data:
	$(PYTHON) DataServer.py

update-hashes:
	$(PYTHON) update_hashes.py

check-hashes:
	$(PYTHON) update_hashes.py --check

lint:
	@if $(PYTHON) -m flake8 --version > /dev/null 2>&1; then \
		$(PYTHON) -m flake8 --ignore=E501,W293,W291,E302,E305,E265,F824,E226,F841,E711,E722,F401,E402,E303,W292 *.py tests/*.py; \
	else \
		echo "flake8 not found, please install it with '$(PIP) install flake8'"; \
	fi

test:
	@if $(PYTHON) -m pytest --version > /dev/null 2>&1; then \
		$(PYTHON) -m pytest; \
	else \
		echo "pytest not found, please install it with '$(PIP) install pytest'"; \
	fi

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
