goose postgres "postgresql://salon:<password>@localhost:5433/salon_booking?sslmode=disable" up

# conn string

postgresql://salon:<password>@postgres:5432/salon_booking?sslmode=disable

# connect to pgsql

docker exec -it beauty-app-postgres-1 psql -U salon -d salon_booking -p 5432

# example login (fake credentials, not a real account)

curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"examplepassword123"}'