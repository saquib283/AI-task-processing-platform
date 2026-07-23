# AI TaskFlow — Infrastructure Repository

Kubernetes manifests, Kustomize overlays, and Argo CD Application definitions for the AI Task Processing Platform.

## Structure

```
infra-repo/
├── base/                        # Shared base manifests
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml              # ⚠️ Template only — never commit real values
│   ├── mongo-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── worker-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── overlays/
│   ├── staging/                 # 1 replica, lower resources, auto-sync
│   │   └── kustomization.yaml
│   └── production/              # 3-5+ replicas, HPA, manual sync
│       └── kustomization.yaml
└── argocd/
    ├── staging-app.yaml         # Argo CD Application (auto-sync + self-heal)
    └── production-app.yaml      # Argo CD Application (manual sync)
```

## Usage

```bash
# Preview staging manifests
kubectl kustomize overlays/staging/

# Preview production manifests
kubectl kustomize overlays/production/

# Apply Argo CD applications
kubectl apply -f argocd/staging-app.yaml
kubectl apply -f argocd/production-app.yaml
```

## Secrets Management

The `base/secret.yaml` contains **placeholder values only**. For production:

1. **Sealed Secrets**: Encrypt secrets client-side, commit encrypted versions
2. **External Secrets Operator**: Pull secrets from AWS Secrets Manager, Vault, etc.
3. **Manual**: Apply secrets directly to the cluster (not recommended for GitOps)

## Image Tag Updates

Image tags are managed via Kustomize `images` transformer in each overlay's `kustomization.yaml`. The CI pipeline automatically updates these using:

```bash
cd overlays/staging
kustomize edit set image aitaskplatform/backend=aitaskplatform/backend:<sha>
```
