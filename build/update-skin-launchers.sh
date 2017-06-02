#!/bin/sh
find ../skins/ -maxdepth 1 ! -path ../skins/ -type d -printf 'grunt create-skin-launcher --skin=%f;\n' | sort | sh