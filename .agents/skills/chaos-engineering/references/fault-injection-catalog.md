# Fault Injection Catalog

Reference catalog of fault types organized by layer (network, host/compute, dependency, resource, state, traffic). For each fault: realistic injection methods, tool mappings (Chaos Mesh / Litmus / AWS FIS / ChaosToolkit / cloud-native), expected manifestations, monitoring guidance, and common bugs surfaced.

---

## How to use this catalog

1. Pick the layer that matches your concern.
2. Read the candidate faults in that layer.
3. Choose the fault that most closely mirrors a **real-world event** you've experienced or worry about.
4. Use the tool mapping for your environment.
5. Wire the monitoring before injecting.

The catalog is descriptive, not exhaustive — adapt to your stack.

---

## Layer 1: Network

### Fault 1.1 — Packet loss

**What:** A percentage of packets between two endpoints are dropped.

**Real-world analog:** Bad cabling, congested intermediate hop, lossy WiFi, cross-AZ flakiness.

**Typical hypothesis:** "App tolerates 1% packet loss with no user-visible impact (TCP retransmit handles it); at 5%, retries kick in; at 10%, errors begin."

**Tool mappings:**
- Chaos Mesh: `NetworkChaos` with `action: loss`
- Litmus: `pod-network-loss` experiment
- ChaosToolkit: `network-tc` driver
- Raw: `tc qdisc add dev eth0 root netem loss 5%`
- AWS FIS: not natively; use SSM script

**Monitoring:** TCP retransmit rate, app-level retry rate, latency p95/p99, connection failure rate.

**Common bugs found:** Insufficient retry backoff causing storms; client-side timeouts shorter than network healing time; missing connection-pool refresh after retransmits.

### Fault 1.2 — Network latency / jitter

**What:** Add fixed or variable latency to packets between endpoints.

**Real-world analog:** Cross-region routing, congested links, vendor latency spikes, mobile connections.

**Typical hypothesis:** "Adding 200ms latency between A and B increases end-to-end p99 by ≤ 250ms (the propagation gets added); no timeouts; no retry storms."

**Tool mappings:**
- Chaos Mesh: `NetworkChaos` with `action: delay` (supports jitter)
- Litmus: `pod-network-latency`
- ChaosToolkit: `network-tc`
- Raw: `tc qdisc add dev eth0 root netem delay 200ms 50ms 25%` (200ms ±50ms with 25% correlation)
- AWS FIS: limited; use SSM

**Monitoring:** Latency per call type, timeout count, retry count, queue depth at caller (latency can mask itself as queue pressure).

**Common bugs found:** Hard-coded timeouts; cascading retries; client-side queue overflow; metric pollution from per-call timers.

### Fault 1.3 — Network partition

**What:** All traffic between two endpoints is blocked.

**Real-world analog:** AZ network failure, security group misconfiguration, BGP issue, vendor outage.

**Typical hypothesis:** "When all traffic between API and DB is blocked, API serves cached data for ≤ cache TTL, then returns clear errors with retry-after. No connections hang. Health check reflects degraded state."

**Tool mappings:**
- Chaos Mesh: `NetworkChaos` with `action: partition`
- Litmus: `pod-network-partition`
- AWS FIS: `aws:network:disrupt-connectivity` (when available)
- Raw: iptables `DROP` rule; security group modification

**Monitoring:** Connection establishment rate (should drop to zero), connection timeout rate (should rise), open file descriptors (should not climb due to leaked sockets), cache hit rate (should rise to 100% during partition).

**Common bugs found:** Sockets leaked on partition (eventually OOM); cache returns stale data without indicating staleness; health check still says "healthy" while service is partitioned from critical dependency.

### Fault 1.4 — DNS failure

**What:** DNS queries fail or are slow.

**Real-world analog:** Resolver outage, TTL expiry coinciding with upstream DNS issue, DNS server slowness.

**Typical hypothesis:** "App tolerates DNS failure for ≤ 30 seconds via cached entries; beyond that, fails fast with clear error. No connection-hang."

**Tool mappings:**
- Chaos Mesh: `DNSChaos`
- Litmus: `pod-dns-error`, `pod-dns-spoof`
- Raw: drop traffic to resolver IPs; manipulate `/etc/resolv.conf`

**Monitoring:** DNS resolution latency, DNS failure rate, downstream connection latency.

**Common bugs found:** DNS lookup blocking on a long timeout; missing local DNS cache; recursive lookups multiplying failure impact.

### Fault 1.5 — Bandwidth throttling

**What:** Available bandwidth is limited (e.g., capped at 1 Mbps).

**Real-world analog:** Saturated link, noisy neighbor, vendor throttling.

**Typical hypothesis:** "At 10× lower bandwidth, large-payload calls (uploads, bulk reads) slow proportionally but don't error. Small calls remain fast."

**Tool mappings:**
- Chaos Mesh: `NetworkChaos` with `action: bandwidth`
- Raw: `tc qdisc add dev eth0 root tbf rate 1mbit burst 32kbit latency 400ms`

**Monitoring:** Throughput per call type, latency for size-binned calls, queue depth, retry behavior.

**Common bugs found:** Large requests time out; chunking not implemented; client buffer fills up; head-of-line blocking on shared connection.

---

## Layer 2: Host / compute

### Fault 2.1 — Instance / pod kill

**What:** A compute instance or pod is killed without warning.

**Real-world analog:** Spot interruption, hardware failure, hypervisor reboot, OOM kill.

**Typical hypothesis:** "Killing 1 of N pods causes < 30s degradation; replacement is healthy within 60s; no requests lost (graceful drain works)."

**Tool mappings:**
- Chaos Mesh: `PodChaos` with `action: pod-kill`
- Litmus: `pod-delete`
- ChaosToolkit: `kubernetes` driver with `terminate_pod`
- Raw: `kubectl delete pod <pod>` (with `--grace-period=0 --force` for instant)
- AWS FIS: `aws:ec2:stop-instances`

**Monitoring:** Per-pod error rate, total error rate, replica count, in-flight request count, autoscaler decisions.

**Common bugs found:** In-flight requests aborted (drain not honored); long startup time for replacement; connection pool sticking to dead pod; statefulset replacement timing issues.

### Fault 2.2 — Pod pause / freeze

**What:** A process is paused (SIGSTOP) without being killed.

**Real-world analog:** Long GC pause, kernel scheduling stall, hung syscall.

**Typical hypothesis:** "If a pod is paused for 30 seconds, callers route to other pods (load balancer + health check); paused pod doesn't accept new connections but eventually catches up on existing ones."

**Tool mappings:**
- Chaos Mesh: not natively; use Litmus or custom
- Litmus: `pod-cpu-hog` (continuous CPU = same effect)
- Raw: `docker pause <container>`, `kill -STOP <pid>` (then `SIGCONT`)

**Monitoring:** Health check pass rate per pod, load balancer 5xx for affected pod, total error rate.

**Common bugs found:** Load balancer takes too long to mark pod unhealthy; client retries to same pod; cascading retries to other pods overload them.

### Fault 2.3 — Container restart

**What:** Process / container is restarted (vs. killed).

**Real-world analog:** App-level crash + auto-restart, deploy, OOM-kill-then-restart.

**Typical hypothesis:** "Restart takes < 30s; no requests lost (handled in-flight); startup probe correctly delays traffic until ready."

**Tool mappings:**
- Chaos Mesh: `PodChaos` with `action: container-kill`
- Raw: `docker restart`, `kubectl rollout restart`

**Monitoring:** Per-pod up-time, in-flight requests at termination, startup time, time from start to first request.

**Common bugs found:** Process restarts faster than dependencies (e.g., DB connection not ready, returns errors during warm-up); startup probe missing; warm-up cache cold for too long.

### Fault 2.4 — Host CPU saturation

**What:** All CPU cores are pegged.

**Real-world analog:** Runaway worker process, GC death-spiral, infinite loop in user code, noisy neighbor.

**Typical hypothesis:** "When CPU is at 100% on a host, application latency increases but no errors. Other co-located processes are throttled (cgroup limits) but functional."

**Tool mappings:**
- Chaos Mesh: `StressChaos` with `stressors.cpu`
- Litmus: `pod-cpu-hog`
- Raw: `stress-ng --cpu 8 --timeout 300`

**Monitoring:** CPU per pod, CPU per host, latency, error rate, throttle metrics, GC time (Java/Go).

**Common bugs found:** No CPU limits set (one runaway eats the host); thread starvation in fixed thread pools; long GC pauses misattributed.

### Fault 2.5 — Host memory pressure

**What:** Memory consumption is high (e.g., 90% used).

**Real-world analog:** Memory leak, large request, batch job, cache growth.

**Typical hypothesis:** "Under memory pressure, kernel pages out cleanly; app continues with slight latency increase due to swap; OOM-killer doesn't fire unless a process exceeds its cgroup limit."

**Tool mappings:**
- Chaos Mesh: `StressChaos` with `stressors.memory`
- Litmus: `pod-memory-hog`
- Raw: `stress-ng --vm 1 --vm-bytes 80% --vm-method all --verify --timeout 300`

**Monitoring:** Memory per pod, swap usage (if enabled), OOM events, latency, error rate.

**Common bugs found:** Process killed by OOM-killer instead of being throttled; cache doesn't evict under pressure; large allocations fail mid-request causing 5xx.

### Fault 2.6 — Disk full

**What:** Available disk space hits a threshold.

**Real-world analog:** Log rotation failure, runaway cache, large file upload, monitoring tool runaway.

**Typical hypothesis:** "At 90% disk, alert fires. At 95%, app rejects writes with 4xx. At 100%, no data corruption; recovery is automatic when space is freed."

**Tool mappings:**
- Chaos Mesh: `IOChaos` with `action: latency` (slow disk approximates), or `StressChaos` with disk
- Raw: `dd if=/dev/zero of=/var/tmp/fill bs=1M count=10000` (until target reached)

**Monitoring:** Disk usage %, write success rate, log write rate (do logs stop?), application error rate.

**Common bugs found:** App crashes on write failure instead of returning 4xx; logger silently drops logs when /var/log full (no observability into the failure); recovery requires manual intervention.

### Fault 2.7 — IO throttling / slow disk

**What:** Disk reads/writes are slow.

**Real-world analog:** EBS throttling, contention with neighbor, SSD wear, disk failure imminent.

**Typical hypothesis:** "At 10× slower disk, write-heavy operations (commits, log flushes) slow proportionally; read-heavy operations stay normal if cached."

**Tool mappings:**
- Chaos Mesh: `IOChaos` with `action: latency` (per-file or all)
- Raw: cgroup `io.max` (Linux); `tc` for storage network

**Monitoring:** Disk read/write latency, IOPS, application latency by operation type, queue depth.

**Common bugs found:** Sync writes (e.g., DB commits) become the bottleneck; flushes block other operations; queue at app layer fills up; transaction timeouts.

---

## Layer 3: Dependency

### Fault 3.1 — Downstream service returns errors (5xx)

**What:** A specific downstream returns 5xx errors for some or all calls.

**Real-world analog:** Downstream outage; downstream bug; downstream overload; rolling deploy hiccup.

**Typical hypothesis:** "When recs-svc returns 503 for 5 minutes, homepage falls back to static recs. Error rate on homepage stays < 0.5%."

**Tool mappings:**
- Mock the downstream with a controllable proxy (toxiproxy, mountebank)
- Chaos Mesh: limited natively; combine with NetworkChaos + custom server
- AWS FIS: `aws:apigw` or custom

**Monitoring:** Per-dependency error rate, fallback path utilization, retry count, circuit breaker state, end-user-visible metrics on dependent features.

**Common bugs found:** No fallback; fallback itself broken; retries amplify load on degraded downstream; circuit breaker never opens; circuit breaker opens but doesn't close.

### Fault 3.2 — Downstream slow

**What:** Downstream returns valid responses but slowly.

**Real-world analog:** Downstream overloaded; GC pause; bad query plan; cross-region call.

**Typical hypothesis:** "When recs-svc latency goes from 50ms to 2s, caller's circuit breaker trips after N requests; fallback engages; no requests hang."

**Tool mappings:**
- Toxiproxy: latency toxic
- Chaos Mesh + NetworkChaos: latency injection at network layer
- Mountebank: configurable latency in mock responses

**Monitoring:** P95/p99 latency per dependency call; timeout count; in-flight call count; thread pool utilization at caller.

**Common bugs found:** Caller has no timeout (waits forever); timeout is too long; in-flight call count grows unboundedly; thread pool saturates and degrades other work.

### Fault 3.3 — Downstream returns malformed data

**What:** Response is parseable HTTP but content is wrong (extra fields, missing fields, wrong types).

**Real-world analog:** Schema change without coordination; bug in producer; data corruption.

**Typical hypothesis:** "When recs-svc returns extra unexpected fields, parser ignores them gracefully (forward-compatible)."

**Tool mappings:**
- Mountebank: customizable response templates
- Custom proxy that mutates responses

**Monitoring:** Parse error rate; schema validation errors; dead-letter queue depth.

**Common bugs found:** Strict parser fails on extra fields; missing-field handling assumes presence; type coercion silently corrupts; cascading parse errors in downstream consumers.

### Fault 3.4 — Downstream returns rate-limit / throttle response

**What:** Downstream returns 429 with Retry-After header.

**Real-world analog:** Vendor rate-limit hit; downstream protecting itself; quota exhausted.

**Typical hypothesis:** "When vendor returns 429, client honors Retry-After, backs off, eventually succeeds. No retry storm. Other features unaffected."

**Tool mappings:**
- Mountebank: configurable to return 429
- Custom proxy

**Monitoring:** 429 rate, retry timing, queue depth, end-to-end latency.

**Common bugs found:** Retry-After ignored; client retries immediately, gets banned; retry queue fills up; cascading 429s upstream.

---

## Layer 4: Resource

### Fault 4.1 — Connection pool exhaustion

**What:** All connections in a pool are consumed.

**Real-world analog:** Slow downstream holding connections; misbehaving query; sudden traffic spike.

**Typical hypothesis:** "When the DB connection pool is exhausted, new requests queue briefly, then fail fast with clear error. Other unrelated features continue."

**Tool mappings:**
- Synthetic load that holds connections; load generator with concurrency = pool size + 1
- Mock DB that holds connections open

**Monitoring:** Pool size in use; pool wait time; request queue depth at app; per-feature error rate.

**Common bugs found:** Pool waits forever (no max-wait); pool wait is on a hot path; no fallback to read-replica; one slow query starves the pool.

### Fault 4.2 — Thread pool / worker exhaustion

**What:** All workers are busy.

**Real-world analog:** Slow downstream; long-running batch; one bad request type pinning all workers.

**Typical hypothesis:** "When all workers are busy, new requests queue briefly, then 503. Health check reflects saturation."

**Tool mappings:**
- Load generator pinned to a slow code path
- Chaos Mesh + StressChaos to slow specific calls

**Monitoring:** Active worker count; queue depth; request latency by type; rejection rate.

**Common bugs found:** Health check doesn't reflect saturation (returns OK even when fully busy); workers blocked on something they should timeout; rejections cascade to caller.

### Fault 4.3 — File descriptor exhaustion

**What:** Process hits ulimit on open files / sockets.

**Real-world analog:** Socket leak; file handle leak; legitimate high concurrency exceeding limit.

**Typical hypothesis:** "When FD count approaches limit, process refuses new connections with clear error. Limit alert fires."

**Tool mappings:**
- Synthetic test: open and hold N connections to target
- Reduce ulimit temporarily for the experiment

**Monitoring:** Open FD count; new connection rate; "too many open files" errors in logs.

**Common bugs found:** Leak in HTTP client (connection not returned to pool); leak in file open without close; ulimit alert missing.

---

## Layer 5: State / data

### Fault 5.1 — Cache flush

**What:** Cache is cleared, causing cold-start behavior.

**Real-world analog:** Deploy; cache server restart; manual flush; eviction storm.

**Typical hypothesis:** "When cache is flushed, origin RPS spikes 10×, autoscaler engages within 90s, p99 latency stays < SLO, no errors."

**Tool mappings:**
- Application-specific API (Redis `FLUSHDB`, CDN purge endpoint, `varnishadm`)
- Chaos Mesh: not directly; use exec

**Monitoring:** Cache hit rate; origin RPS; origin error rate; cache replenishment rate.

**Common bugs found:** Origin can't handle full traffic (was always cached); thundering herd; autoscaler too slow; cache cold-start data is stale or wrong.

### Fault 5.2 — Cache poisoned with stale data

**What:** Cache returns stale data while underlying source has updated.

**Real-world analog:** Cache invalidation bug; producer-consumer race; replication lag.

**Typical hypothesis:** "Stale cache entries are detected within TTL; user-visible staleness is bounded."

**Tool mappings:**
- Manually write stale data to cache; observe behavior
- Slow replication on purpose (latency injection)

**Monitoring:** Cache age distribution; stale-data error count (if you detect it); user reports.

**Common bugs found:** No staleness detection; user-visible inconsistency; rollback fails because cache disagrees with source.

### Fault 5.3 — Clock skew

**What:** System time on one or more hosts is wrong.

**Real-world analog:** NTP issue; VM clock drift; deliberate manipulation.

**Typical hypothesis:** "With clocks skewed by 60 seconds, TLS still works (within tolerance), JWTs still validate, ordering of events is best-effort."

**Tool mappings:**
- Chaos Mesh: `TimeChaos`
- Raw: `date -s` on the host (don't do this in prod casually)

**Monitoring:** Clock drift metric; TLS errors; JWT validation failures; event ordering anomalies.

**Common bugs found:** TLS handshake fails because of clock mismatch with CA; JWTs treated as expired (or not-yet-valid); ordering bugs in distributed coordination.

### Fault 5.4 — Data corruption injected

**What:** Bad/corrupted data is written to the system.

**Real-world analog:** Bug in producer; replication corruption; user attack.

**Typical hypothesis:** "Corrupted message is rejected at boundary; dead-letter queue captures it; alert fires; no downstream impact."

**Tool mappings:**
- Custom — depends on data model. Write known-bad records to a non-prod boundary.

**Monitoring:** Validation error rate; DLQ depth; downstream error rate; data quality checks.

**Common bugs found:** Validation missing at boundary; DLQ doesn't exist; corruption propagates silently to downstream; recovery requires manual DB surgery.

---

## Layer 6: Traffic

### Fault 6.1 — Traffic spike

**What:** Request rate is multiplied (e.g., 5×) for a sustained period.

**Real-world analog:** Viral marketing moment; bot attack; product launch; news mention.

**Typical hypothesis:** "At 5× normal traffic for 5 minutes: autoscaler engages within 90s, latency stays under SLO, error rate stays < 1%."

**Tool mappings:**
- Load generators: k6, Locust, Vegeta, JMeter, Artillery
- Always send **synthetic traffic** to avoid affecting real users

**Monitoring:** Request rate, autoscaler decisions, latency, error rate, queue depth at every layer.

**Common bugs found:** Autoscaler too slow; cold cache amplifies origin load; rate-limiters fire on legitimate spike; downstream services overload before primary autoscales.

### Fault 6.2 — Slowloris-style attack

**What:** Many connections opened slowly, holding resources without sending complete requests.

**Real-world analog:** Slowloris attack; misbehaving client; mobile network.

**Typical hypothesis:** "Server detects slow clients and times out their connections. Health stays normal."

**Tool mappings:**
- `slowhttptest`
- Custom k6 script with delayed payloads

**Monitoring:** Half-open connection count; total connection count; per-IP connection count.

**Common bugs found:** No connection timeout; per-IP limits missing; reverse proxy doesn't enforce slow-client policy.

### Fault 6.3 — Replay attack pattern

**What:** Old requests replayed; or requests with reused nonces/tokens.

**Real-world analog:** Compromised credentials; bot using captured tokens; legitimate retry logic looping.

**Typical hypothesis:** "Replayed requests are detected by nonce/replay-protection; rejected with clear error; rate-limited."

**Tool mappings:**
- Capture real traffic (carefully — privacy), replay with adjusted timing
- Custom k6 / Vegeta scripts

**Monitoring:** Replay detection rate, rate-limit triggers, security alert fires.

**Common bugs found:** No replay detection; nonce reuse allowed; rate-limit too lax.

---

## Cross-layer scenarios (composite faults)

Once single-layer experiments are clean, combine faults to test cascading failures.

### Composite C.1: Network partition + retry storm

Block traffic between A and B → observe whether retries from A cause downstream cascade.

### Composite C.2: Disk fill + log flushing

Fill disk → observe whether log flushing stops, hiding subsequent errors from observability.

### Composite C.3: Latency + autoscaling

Inject latency → autoscaler thinks the service is under load → spins up more pods → each new pod is also slow → cost explosion without resolution.

### Composite C.4: Single AZ degraded + cross-AZ traffic

Degrade AZ → traffic shifts to other AZs → cross-AZ data transfer cost spikes → bandwidth saturates → other AZ degrades.

Composites are L3+ territory. Start with single-layer faults.

---

## Tool-to-fault matrix

| Fault | Chaos Mesh | Litmus | ChaosToolkit | AWS FIS | Raw / DIY |
|-------|------------|--------|--------------|---------|-----------|
| Pod kill | PodChaos | pod-delete | k8s driver | EC2 stop-instances | kubectl |
| Network latency | NetworkChaos | pod-network-latency | k8s + tc | n/a | tc qdisc |
| Network partition | NetworkChaos | pod-network-partition | k8s + iptables | aws:network:disrupt-connectivity | iptables / SG |
| DNS error | DNSChaos | pod-dns-error | n/a | n/a | resolv.conf |
| CPU stress | StressChaos | pod-cpu-hog | stress-ng | n/a | stress-ng |
| Memory stress | StressChaos | pod-memory-hog | stress-ng | n/a | stress-ng |
| Disk IO latency | IOChaos | n/a | n/a | n/a | cgroup io.max |
| Disk fill | n/a | n/a | n/a | n/a | dd |
| Clock skew | TimeChaos | n/a | n/a | n/a | date -s |
| Traffic spike | n/a | n/a | n/a | n/a | k6 / Locust |

This is a starting matrix; check current docs of each tool for new capabilities.

---

## Safety rules across all fault types

- **Default blast radius:** 1 instance / 1% of traffic / 1 minute. Expand only after success.
- **Abort threshold:** Pre-define. Test the abort before injecting.
- **Observer required:** Never run chaos solo.
- **Customer comms:** For prod chaos, notify support team and have an escalation path.
- **Real-incident priority:** If a real incident lands during chaos, chaos pauses immediately.
- **Post-run writeup:** Within 5 business days, with action items + owners + dates.
- **Catalog the experiment:** Keep it for re-running as a regression test.

---

## Summary

| To learn about... | Pick a fault from layer... | Start with... |
|------------------|---------------------------|---------------|
| Auto-recovery, scaling | Host (2.1, 2.4) | Pod kill |
| Timeout/retry behavior | Network (1.2), Dependency (3.2) | Latency injection |
| Fallback paths, degradation | Dependency (3.1, 3.3), Network (1.3) | Service returns 503 |
| Resource limits, throttling | Resource (4.1, 4.2), Host (2.4-2.7) | Connection pool exhaustion |
| Cache and state assumptions | State (5.1, 5.2) | Cache flush |
| Load and traffic patterns | Traffic (6.1) | 5× traffic spike |
| Multi-AZ resilience | Network (1.3) + Host (2.1) | AZ-level partition |
