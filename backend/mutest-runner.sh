#!/bin/bash
cd /var/www/alfa.software.net.co/backend
go test ./internal/inventory/ ./internal/suppliers/ ./internal/remissions/ -count=1
exit $?
