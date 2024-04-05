# DevOps 4 Devs

## Aula 01:
O projeto conversão de temperatura se encontra no link abaixo:

https://github.com/KubeDev/conversao-temperatura

## Aula 02:

### Comando para criar o cluster Kubernetes local com K3D:

```bash
k3d cluster create meucluster --servers 3 --agents 3 -p "30000:30000@loadbalancer"
```

## Aula 03: 

### URL do template usado do Cloud Formation:
```
https://s3.us-west-2.amazonaws.com/amazon-eks/cloudformation/2020-10-29/amazon-eks-vpc-private-subnets.yaml
```

## Aula 04

### Link para a AWS:

https://aws.amazon.com

### Link para instalação do AWS CLI:

https://aws.amazon.com/pt/cli


### Template do Cloud Formation:
```
https://s3.us-west-2.amazonaws.com/amazon-eks/cloudformation/2020-10-29/amazon-eks-vpc-private-subnets.yaml
```

### Link para Azure:

https://azure.microsoft.com

### Link para instalação do Azure CLI:

https://learn.microsoft.com/pt-br/cli/azure/install-azure-cli

### Link para Google Cloud:

https://cloud.google.com

### Link para instalação do Azure CLI:

https://cloud.google.com/sdk/docs/install?hl=pt-br

# Aula 05 

### Comando para obter a senha do Grafana
```
kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```