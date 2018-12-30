#!/bin/bash

openssl genrsa -out private.pem 4096
openssl rsa -pubout -in private.pem -out public.pem
