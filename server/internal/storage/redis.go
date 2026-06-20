package storage

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	Client *redis.Client
}

func NewRedisClient() *RedisClient {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	client := redis.NewClient(&redis.Options{

		Addr:         "localhost:6379",
		Password:     "",
		DB:           0,
		PoolSize:     10,
		MinIdleConns: 3,
	})

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Redis statistical state engine successfully verified.")
	return &RedisClient{Client: client}
}

func (r *RedisClient) GetState(ctx context.Context, key string) (float64, error) {
	val, err := r.Client.Get(ctx, key).Float64()
	if err == redis.Nil {
		return 0.0, nil
	}
	if err != nil {
		return 0.0, fmt.Errorf("redis state extraction failed for key %s: %w", key, err)
	}
	return val, nil
}

func (r * RedisClient) SetState(ctx context.Context,key string,value float64) error {
	err := r.Client.Set(ctx,key,value,0).Err()
	if err != nil {
		return fmt.Errorf("redis state update failed for key %s: %w", key, err)
	}
	return nil
}
