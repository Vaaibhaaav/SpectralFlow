package client

import (
	"context"
	"fmt"
)

func main() {
	client := NewSpectraflowClient("http://localhost:8080", "eadae7f4-6dca-4bf.......", "gsk_UVtwj4x........")

	text, err := client.Completion(context.Background(), "llama3.1-8b-instant", "Hello, how are you?")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(text)
}
