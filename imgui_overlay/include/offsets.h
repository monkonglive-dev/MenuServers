#pragma once
// Offsets for Animal Company - Fill in from Il2CppDumper output
// Run Il2CppDumper on GameAssembly.dll + global-metadata.dat first

#include <cstdint>

namespace offsets {

    // Module bases (populated by dumper or at runtime)
    extern uint64_t GameAssembly;
    extern uint64_t UnityPlayer;

    namespace GorillaLocomotion {
        // AnimalCompany.GorillaLocomotion
        constexpr uint32_t Instance       = 0x0;  // <Instance>k__BackingField (static)
        constexpr uint32_t LeftHand       = 0x0;  // leftHandTransform
        constexpr uint32_t RightHand      = 0x0;  // rightHandTransform
        constexpr uint32_t HeadCollider   = 0x0;  // headCollider
        constexpr uint32_t BodyCollider   = 0x0;  // bodyCollider
        constexpr uint32_t RigidBody      = 0x0;  // _playerRigidBody
        constexpr uint32_t PlayerScale    = 0x0;  // <playerScale>k__BackingField
    }

    namespace NetPlayer {
        // AnimalCompany.NetPlayer
        constexpr uint32_t HandRight   = 0x0;  // handRight
        constexpr uint32_t HandLeft    = 0x0;  // handLeft
        constexpr uint32_t Head        = 0x0;  // head
        constexpr uint32_t PlayerId    = 0x0;  // _playerId
        constexpr uint32_t DisplayName = 0x0;  // _displayName

        // VTable indexes (method slots)
        constexpr int GetIsMine       = 0;
        constexpr int GetLocalPlayer  = 0;  // static
        constexpr int GetRigData      = 0;
        constexpr int SetRigData      = 0;
    }

    namespace PrefabGen {
        constexpr uint32_t Instance = 0x0;  // _instance (static)
    }

    namespace NetworkRunner {
        constexpr uint32_t Config = 0x0;  // _config
    }

    // Unity engine offsets
    namespace Unity {
        namespace Transform {
            constexpr uint32_t GetPosition      = 0xD0;  // approximate, adjust per version
            constexpr uint32_t SetPosition      = 0xD8;
            constexpr uint32_t GetRotation      = 0xE0;
            constexpr uint32_t SetRotation      = 0xE8;
            constexpr uint32_t GetForward       = 0xF0;
            constexpr uint32_t GetLocalScale    = 0xF8;
            constexpr uint32_t SetLocalScale    = 0x100;
        }
        namespace Vector3 {
            constexpr uint32_t ZeroVector  = 0x0;  // static field
            constexpr uint32_t OneVector   = 0x0;  // static field
        }
    }

}  // namespace offsets
