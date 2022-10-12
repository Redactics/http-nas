### About

This is very lightweight Node.js http file streamer that functions as NAS (network attached storage) with Kubernetes usage in mind. We make heavy use of this at [Redactics](https://www.redactics.com). You can learn more about this from [this blog post](https://dev.to/joeauty/open-source-media-streaming-service-for-kubernetes-1k62).

### Huh, Weird... Why Does the World Need This?

Job pipelines that run in Kubernetes (for example, Airflow `KubernetesPodOperator` DAG steps) that require persistent storage face some challenges. Here are some common tactics and their associated issues:

* `Mounting Kubernetes persistent volumes/persistent volume claims in the container`: we've seen timeouts/timing issues with doing so in AWS. AWS recommends installing the [EBS CSI driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) to mitigate these issues, but this requires a bunch of extra steps and figuring out how to maintain this in Terraform/IaC. This approach also doesn't work with AWS Fargate, using the AWS EFS CSI driver is recommended for this, which presents the same problems as well as dependencies on NFS.
* `Running an NFS server in Kubernetes`: this can work, but it can sort of create a black box with poor visibility, and solutions that create new NFS storage classes will not run in serverless Kubernetes solutions such as AWS Fargate or GKE Autopilot.
* `Using an AWS S3 bucket for storage`: works great, but having to download and upload files to the cloud has bandwidth and performance costs.
* `Skipping persistent storage altogether`: if you've read this far you've probably already ruled this out, but the storage attached to a pod is stateless (i.e. will not persist) and controlling storage capacity can only be done at the node level.

### How Does it Work?

You can install this service via the helmchart included in this repo, or via:

```
helm repo add redactics https://redactics.github.io/http-nas
helm install http-nas redactics/http-nas --set "pvc.size=10Gi" --set "storagePath=/mnt/storage"
```

This deploys the file streaming to your Kubernetes cluster with a PersistentVolumeClaim for storing files within this service of 10GB (you can of course adjust this to whatever size you want), and the path inside the container used for storage `/mnt/storage`, which can also be anything so long as the parent directory exists (`/mnt` and `/tmp` are good choices for storagePath directories). Then, from inside your cluster you can run any of the following commands to interact with this service:

* Stream (via http/REST post URL) file to service: `cat /path/to/cat.jpg | curl -X POST -H "Transfer-Encoding: chunked" -s -f -T - http://http-nas:3000/file/cat.jpg`. Note that this file can be streamed via `cat` plus a Linux pipe (i.e. `|`) rather than read in its entirety and loaded into memory - this entire service is http stream based. You don't have to use cURL to post this file, you can use any library or tool that can http post.
* Append (via http/REST put URL) to file: `printf "test append" | curl -X PUT -H "Transfer-Encoding: chunked" -s -f -T - http://http-nas:3000/file/mydata.csv`.
* Stream (via http/REST get URL) file from service: `curl http://http-nas:3000/file/cat.jpg`. This output can be piped elsewhere as well (e.g. `curl http://http-nas:3000/file/cat.jpg | aws s3 cp - s3://yourbucket/cat.jpg`)
* Stream (via http/REST get URL) line count of file from service - i.e. the equivalent of a Linux `wc -l`: `curl http://http-nas:3000/file/mydata.csv/wc` (returns a string output)
* Stream a file to service with a directory structure: `cat /path/to/cat.jpg | curl -X POST -H "Transfer-Encoding: chunked" -s -f -T - http://http-nas:3000/file/mydirectory%2Fcat.jpg`. `%2F` is the URL encoding of a path (i.e. `/`). Since this service is http based if we don't encode this path it will modify the URL and routing to the underlying service. If `mydirectory` doesn't exist in the underlying storage volume it will be automatically created.
* Stream file inside directory from service: `curl http://http-nas:3000/file/mydirectory%2Fcat.jpg`
* Move (mv) file (via http/REST put URL): `curl -X PUT http://http-nas:3000/file/cat.jpg --header 'Content-Type: application/json' --data-raw '{ "path": "newcat.jpg" }'`. This renames/moves `cat.jpg` -> `newcat.jpg` sending the new filename in a JSON formatted payload.
* Delete file (via http http/REST delete URL): `curl -X DELETE http://http-nas:3000/file/cat.jpg`

### Usage in Serverless Kubernetes

This service works as is in GKE Autopilot. In AWS EKS Fargate, this helm chart will not deploy due to its dependency on a persistent volume. We recommend creating a new Fargate profile to deploy this into a dedicated Kubernetes namespace that uses a physical/managed node. This node can be the smallest possible instance type, this service is very light on resource usage. Then, assuming your namespace is entitled `nas`, you can make cross-namespace http requests by replacing `http://http-nas:3000` with `http://http-nas.nas.svc.cluster.local:3000` where `http-nas` is the Kubernetes service name, and `nas` is the namespace.
