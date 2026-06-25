---
titulo: "Aula 06 — Questões de Aprendizagem"
modulo: "Docker — Da Containerização ao Deploy em Produção"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 06: Kubernetes — Introdução à Orquestração em Produção"
data: 2026-06-18
---

# Aula 06 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o **checkpoint de domínio** da Aula 06. Cada questão valida uma habilidade prática essencial de Kubernetes — da arquitetura ao deploy de uma aplicação completa. Siga a ordem das questões, pois elas se acumulam. Crie uma pasta `entregas-aula-06/` no seu diretório de trabalho para organizar os arquivos que você vai gerar. Se travar em alguma questão, consulte a seção indicada em **Conceito-chave** antes de pedir ajuda.

## Questão 1: Arquitetura e Mapeamento Swarm → K8s

**Conceito-chave:** Aula 06, Seções 1-2-4 (Arquitetura de Cluster e Kubernetes)

**Objetivo:** Desenhar diagrama da arquitetura K8s e criar tabela de mapeamento Swarm → K8s

**Passos de Execução:**

1. Descreva os componentes do **control plane** (API Server, Scheduler, Controller Manager, etcd) e do **data plane** (kubelet, kube-proxy, container runtime) em um diagrama de blocos.
2. Crie uma tabela com **8 mapeamentos** entre conceitos do Docker Swarm e seus equivalentes no Kubernetes (ex.: Swarm Manager → Control Plane, Swarm Node → Worker Node, Service → Deployment + Service, etc.).
3. Explique em 3-5 linhas qual a diferença fundamental entre um **Swarm Service** e um **K8s Deployment**.

**Entrega:**

```markdown
### Diagrama da Arquitetura K8s

[Insira aqui seu diagrama de blocos — mão livre, draw.io ou Mermaid]

### Tabela de Mapeamento Swarm → K8s

| Conceito Docker Swarm | Conceito Kubernetes | Explicação |
|---|---|---|
| Swarm Manager | | |
| Swarm Node | | |
| Service (modo replicado) | | |
| Task | | |
| Stack | | |
| Config | | |
| Secret | | |
| Overlay Network | | |

### Diferença Fundamental

[Explique aqui a diferença entre Swarm Service e K8s Deployment]
```

---

## Questão 2: minikube e kubectl Operacional

**Conceito-chave:** Aula 06, Seção 5 (minikube e kubectl)

**Objetivo:** Instalar minikube, iniciar cluster, verificar operação e explorar namespaces

**Passos de Execução:**

1. Instale o minikube (ou verifique se já está instalado com `minikube version`). Inicie o cluster com `minikube start --driver=docker`.
2. Verifique os nós do cluster e informações do sistema com `kubectl get nodes` e `kubectl cluster-info`.
3. Liste todos os namespaces com `kubectl get namespaces`. Liste todos os pods do namespace `kube-system`.
4. Salve todos os outputs em um arquivo `outputs-q2.txt`.

**Entrega:**

```markdown
### Comandos e Outputs — Questão 2

**minikube version:**

    [cole aqui]

**minikube start:**

    [cole aqui]

**kubectl get nodes:**

    [cole aqui]

**kubectl cluster-info:**

    [cole aqui]

**kubectl get namespaces:**

    [cole aqui]

**kubectl get pods -n kube-system:**

    [cole aqui]
```

---

## Questão 3: Pods e Deployments — API Express

**Conceito-chave:** Aula 06, Seções 6-7 (Pods e Deployments)

**Objetivo:** Criar Deployment YAML para API Express e fazer deploy

**Passos de Execução:**

1. Escreva um arquivo `api-deployment.yaml` com um Deployment que use a imagem `seurepo/minha-api:v1`, 2 réplicas, container na porta 3000, resource limits (CPU 256m / memória 128Mi) e liveness probe (`GET /health`).
2. Aplique o manifesto com `kubectl apply -f api-deployment.yaml`.
3. Verifique os pods criados com `kubectl get pods -o wide`.
4. Execute um **rolling update** mudando a tag da imagem para `v2` no YAML, reaplique e acompanhe a atualização com `kubectl rollout status deployment/api-deployment`.

**Entrega:**

```markdown
### Manifesto api-deployment.yaml

```yaml
[Insira aqui seu YAML completo]
```

### Verificação

**kubectl get pods -o wide (após deploy inicial):**
```
[cole aqui]
```

**kubectl rollout status (após rolling update):**
```
[cole aqui]
```

**kubectl get pods -o wide (após rolling update concluído):**
```
[cole aqui]
```
```

---

## Questão 4: Services — Conectando API e Banco

**Conceito-chave:** Aula 06, Seção 8 (Services)

**Objetivo:** Criar Service NodePort para API e ClusterIP para banco, testar conectividade DNS

**Passos de Execução:**

1. Crie `api-service.yaml`: Service do tipo **NodePort** apontando para o deployment da API (porta 3000, targetPort 3000, nodePort 30080).
2. Crie `db-service.yaml`: Service do tipo **ClusterIP** para um banco PostgreSQL (porta 5432). Crie também um Deployment simples para o banco com a imagem `postgres:16-alpine` e variável `POSTGRES_PASSWORD=admin`.
3. Teste o acesso externo com `minikube service api-service --url` e faça uma requisição `curl`.
4. Teste a resolução DNS interna: dentro de um pod temporário, use `nslookup db-service` ou `curl` para o service do banco.

**Entrega:**

```markdown
### Manifestos

**api-service.yaml:**
```yaml
[Insira aqui seu YAML]
```

**db-service.yaml:**
```yaml
[Insira aqui seu YAML]
```

### Testes

**minikube service api-service --url:**
```
[cole aqui]
```

**curl para a API via NodePort:**
```
[cole aqui]
```

**Teste de DNS interno (kubectl run ... -- nslookup db-service):**
```
[cole aqui]
```
```

---

## Questão 5: ConfigMaps e Secrets

**Conceito-chave:** Aula 06, Seção 9 (ConfigMaps e Secrets)

**Objetivo:** Externalizar configuração da API com ConfigMap e Secret

**Passos de Execução:**

1. Crie um ConfigMap `api-config` com os dados literais `DB_HOST=db-service` e `DB_PORT=5432`.
2. Crie um Secret `api-secret` com o dado literal `DB_PASSWORD=secret123`.
3. Referencie ambos no Deployment da API usando `envFrom` (ConfigMap e Secret, ambos via `envFrom` sem `prefix`).
4. Verifique as variáveis de ambiente dentro de um pod da API com `kubectl exec deploy/api-deployment -- env | grep DB_`.

**Entrega:**

```markdown
### ConfigMap e Secret

**Comando para criar o ConfigMap:**
```
[cole aqui]
```

**Comando para criar o Secret:**
```
[cole aqui]
```

### Fragmento do Deployment (envFrom)

```yaml
[Insira o trecho spec.template.spec.containers[].envFrom do seu YAML]
```

### Verificação

**kubectl exec deploy/api-deployment -- env | grep DB_:**
```
[cole aqui]
```
```

---

## Questão 6: Tradução Completa Compose → K8s

> ⚠️ **Projeto Progressivo** — Esta questão integra tudo que você construiu nas aulas anteriores do módulo. Retome seu `docker-compose.yml` da Aula 04/05 e traduza-o completamente para Kubernetes.

**Conceito-chave:** Aula 06, Seção 10 (De Compose para K8s)

**Objetivo:** Traduzir docker-compose.yml completo (API Express + PostgreSQL) para manifests K8s

**Passos de Execução:**

1. Crie os **7 manifests YAML** necessários: `db-pvc.yaml` (PersistentVolumeClaim para dados do banco), `db-deployment.yaml`, `db-service.yaml` (ClusterIP), `api-configmap.yaml`, `api-secret.yaml`, `api-deployment.yaml` (já criado nas questões anteriores — ajuste-o para referenciar o ConfigMap e Secret), `api-service.yaml`.
2. Aplique todos com `kubectl apply -f .`.
3. Verifique todos os recursos: `kubectl get all`, `kubectl get cm`, `kubectl get secrets`, `kubectl get pvc`.
4. Teste o endpoint da API via NodePort com `curl`.

**Entrega:**

```markdown
### Manifests Criados

- [ ] `db-pvc.yaml`
- [ ] `db-deployment.yaml`
- [ ] `db-service.yaml`
- [ ] `api-configmap.yaml`
- [ ] `api-secret.yaml`
- [ ] `api-deployment.yaml`
- [ ] `api-service.yaml`

### Verificação de Recursos

**kubectl get all:**
```
[cole aqui]
```

**kubectl get cm:**
```
[cole aqui]
```

**kubectl get secrets:**
```
[cole aqui]
```

**kubectl get pvc:**
```
[cole aqui]
```

### Teste da API

**curl via NodePort:**
```
[cole aqui]
```

### Reflexão

Liste ao menos **3 diferenças** que você percebeu entre definir a aplicação em um único `docker-compose.yml` versus separar em múltiplos manifests K8s:

1.
2.
3.
```

---

## Questão 7: Diagnóstico de Falhas

**Conceito-chave:** Aula 06, Seções 6-7-11 (Pods, Deployments, Troubleshooting)

**Objetivo:** Diagnosticar problemas comuns em workloads K8s usando comandos de troubleshooting

**Passos de Execução:**

1. Crie um Pod com uma imagem que **não existe** (ex.: `fake-image:404`) e use `kubectl describe pod` e `kubectl logs` para diagnosticar.
2. Crie um Pod com a **porta errada** (container escutando na 3000, mas liveness probe apontando para a 9999) e diagnostique com `kubectl describe`.
3. Use `kubectl get events --sort-by='.lastTimestamp'` para ver os eventos do namespace e correlacionar com os erros observados.

**Entrega:**

```markdown
### Tabela de Diagnóstico

| Cenário | Sintoma | Comando Usado | Saída Relevante | Causa Provável |
|---|---|---|---|---|
| Imagem inexistente | | | | |
| Porta errada no probe | | | | |

### Logs e Eventos

**Cenário 1 — kubectl describe pod <pod>:**
```
[cole aqui]
```

**Cenário 1 — kubectl logs <pod>:**
```
[cole aqui]
```

**Cenário 2 — kubectl describe pod <pod>:**
```
[cole aqui]
```

**Eventos do namespace:**
```
[cole aqui]
```
```

---

## Questão 8: Docker Hub + imagePullSecrets

**Conceito-chave:** Aula 06, Seção 11 (Integração com Docker Hub)

**Objetivo:** Configurar pull de imagem privada no K8s com imagePullSecrets

**Passos de Execução:**

1. Crie um Secret do tipo `docker-registry` com suas credenciais do Docker Hub: `kubectl create secret docker-registry dockerhub-cred --docker-server=https://index.docker.io/v1/ --docker-username=<SEU_USER> --docker-password=<SEU_PASS>`.
2. Configure um Deployment para usar `imagePullSecrets` e puxar uma imagem privada do seu repositório no Docker Hub.
3. Verifique se o pull foi bem-sucedido com `kubectl describe pod` (o evento deve mostrar "Successfully pulled image" sem erros de autenticação).

**Entrega:**

```markdown
### Criação do Secret

**Comando utilizado:**
```
[cole aqui]
```

**kubectl get secrets dockerhub-cred:**
```
[cole aqui]
```

### Deployment com imagePullSecrets

```yaml
[Insira aqui seu YAML destacando o campo imagePullSecrets]
```

### Verificação

**kubectl describe pod <pod> | grep -A5 "Events":**
```
[cole aqui]
```
```

---

## Checklist Final: Pronto para Produção?

Antes de seguir para a próxima etapa, verifique se você consegue:

- [ ] **1.** Descrever a arquitetura do Kubernetes e mapear seus componentes para o Docker Swarm
- [ ] **2.** Inicializar um cluster local com minikube e operá-lo com kubectl
- [ ] **3.** Criar Deployments declarativos com controle de réplicas e estratégia de atualização
- [ ] **4.** Expor aplicações com Services (NodePort, ClusterIP) e testar conectividade DNS
- [ ] **5.** Externalizar configuração com ConfigMaps e Secrets
- [ ] **6.** Traduzir um docker-compose.yml completo para manifests K8s multiplos
- [ ] **7.** Diagnosticar falhas de imagem, probe e outros erros comuns com ferramentas nativas
- [ ] **8.** Configurar autenticação com Docker Hub para imagens privadas
- [ ] **9.** Explicar quando usar Swarm versus Kubernetes com base no cenário
- [ ] **10.** Navegar pela documentação oficial (`kubectl explain`, `docs.k8s.io`) para resolver problemas novos

> 🎉 Parabéns! Se você completou todas as questões e marcou pelo menos 8 itens acima, você domina o ciclo completo — da containerização com Docker ao deploy orquestrado com Kubernetes. Isso é o que separa um operador de um engenheiro de plataforma. Continue praticando!
