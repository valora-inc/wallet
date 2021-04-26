# Set up a VPC network
gcloud alpha compute networks create --project celo-mobile-alfajores --region us-central1 default \
    --subnet-mode=auto \
    --bgp-routing-mode=regional

# Create connector
gcloud beta compute networks vpc-access connectors create connector-simplex --region us-central1 --range "10.8.0.0/28"

# Creating a Serverless VPC Access connector
gcloud alpha functions deploy --project celo-mobile-alfajores --region us-central1  processSimplexRequest \
--vpc-connector connector-simplex \
--egress-settings all 


# Create NAT router
gcloud alpha compute routers create --project celo-mobile-alfajores --region us-central1 default-router --network=default

# Set up Cloud NAT and specify a static IP address.
gcloud alpha compute routers nats create --project celo-mobile-alfajores --region us-central1 simplex \
    --router=default-router \
    --auto-allocate-nat-external-ips \
    --nat-all-subnet-ip-ranges \
    --enable-logging