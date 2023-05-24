#!/bin/sh

# Create dir in case it doesn't exists...
if [ ! -d src/keys ]
then
  echo "Generating keys directory..."
  mkdir -p src/keys
fi

if [ ! -f ./src/keys/JWT_RS256.key ]; then
  # Generate private key
  echo "Generating private key...";
  ssh-keygen -t rsa -b 4096 -m PEM -f ./src/keys/JWT_RS256.key -q -N ""
  # Generate public key
  echo "Generating public key...";
  openssl rsa -in ./src/keys/JWT_RS256.key -pubout -outform PEM -out ./src/keys/JWT_RS256.key.pub
fi



