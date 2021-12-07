### About

This is very lightweight Node.js http file streamer that functions as NAS (network attached storage) with Kubernetes usage in mind.

### Huh, Weird... Why Does the World Need This?

Job pipelines that run in Kubernetes (for example, Airflow `KubernetesPodOperator` DAG steps) that require persistent storage face some challenges. Here are some common tactics and their associated issues:

* `Mounting Kubernetes persistent volumes/persistent volume claims in the container`: we've seen timeouts/timing issues with doing so in AWS. AWS recommends installing the [EBS CSI driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) to mitigate these issues, but this requires a bunch of extra steps and figuring out how to maintain this in Terraform/IaC. This approach also doesn't work with AWS Fargate, using the AWS EFS CSI driver is recommended for this, which presents the same problems as well as dependencies on NFS.
* `Running an NFS server in Kubernetes`: this can work, but it can sort of create a black box with poor visibility, and solutions that create new NFS storage classes will not run in serverless Kubernetes solutions such as AWS Fargate or GKE Autopilot.
* `Using an AWS S3 bucket for storage`: works great, but having to download and upload files to the cloud has bandwidth and performance costs.
* `Skipping persistent storage altogether`: if you've read this far you've probably already ruled this out, but the storage attached to a pod is stateless (i.e. will not persist) and controlling storage capacity can only be done at the node level.

