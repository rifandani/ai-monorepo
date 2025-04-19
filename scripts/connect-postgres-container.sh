#!/bin/bash

docker exec -it pgvector_db psql -U pgvector_db -d pgvector_db

# -- Check installed extensions
# \dx

# -- Check table creation
# \dt