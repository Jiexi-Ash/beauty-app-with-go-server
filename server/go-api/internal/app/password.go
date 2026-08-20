package app

import (
	"fmt"
	"log"

	"github.com/alexedwards/argon2id"
)

func HashPassword(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}

	hash, err := argon2id.CreateHash(password, &argon2id.Params{
		Memory:      19 * 1024,
		Parallelism: 1,
		Iterations:  2,
		SaltLength:  16,
		KeyLength:   32,
	})

	if err != nil {
		return "", fmt.Errorf("something went wrong: %w", err)
	}

	return hash, nil
}

func VerifyPassword(password, hash string) (bool, error) {
	if password == "" || hash == "" {
		return false, fmt.Errorf("values cannot be empty")
	}

	match, err := argon2id.ComparePasswordAndHash(password, hash)

	if err != nil {
		log.Printf("verify password error:: %v", err.Error())
		return false, fmt.Errorf("invalid email or password")
	}

	return match, nil
}
