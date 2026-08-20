# ---- Build stage ----
    FROM golang:1.26.5-alpine3.24 AS builder
    # ^ full Go toolchain, named "builder" so we can copy from it later
    
    WORKDIR /app
    
    COPY go.mod go.sum* ./
    # copy dependency files first (cached separately from source code)
    
    RUN go mod download
    # fetch dependencies — only re-runs if go.mod/go.sum change
    
    COPY . .
    # now copy the rest of the source code
    
    RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./main.go
    # compile to a static binary
    # CGO_ENABLED=0 -> no C dependencies, runs on alpine's musl libc
    # GOOS=linux -> target linux regardless of host OS
    
    # ---- Run stage ----
    FROM alpine:latest
    # fresh, minimal image — builder stage (Go tools, source) is discarded
    
    RUN apk add --no-cache tzdata

    WORKDIR /app
    
    COPY --from=builder /server .
    # grab only the compiled binary from the builder stage
    
    EXPOSE 8080
    # documents the port — doesn't actually publish it (need -p flag or compose)
    
    CMD [ "./server" ]
    # run the binary when the container starts